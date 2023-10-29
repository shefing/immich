import {
  AssetFaceId,
  IPersonRepository,
  PersonNameSearchOptions,
  PersonSearchOptions,
  PersonStatistics,
  UpdateFacesData,
} from '@app/domain';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AlbumEntity, AssetEntity, AssetFaceEntity, PersonEntity } from '../entities';

const peopleLimit = Number(process.env.PEOPLE_LIMIT);

export class PersonRepository implements IPersonRepository {
  constructor(
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectRepository(PersonEntity) private personRepository: Repository<PersonEntity>,
    @InjectRepository(AssetFaceEntity) private assetFaceRepository: Repository<AssetFaceEntity>,
    @InjectRepository(AlbumEntity) private albumRepository: Repository<AlbumEntity>,
  ) {}

  /**
   * Before reassigning faces, delete potential key violations
   */
  async prepareReassignFaces({ oldPersonId, newPersonId }: UpdateFacesData): Promise<string[]> {
    const results = await this.assetFaceRepository
      .createQueryBuilder('face')
      .select('face."assetId"')
      .where(`face."personId" IN (:...ids)`, { ids: [oldPersonId, newPersonId] })
      .groupBy('face."assetId"')
      .having('COUNT(face."personId") > 1')
      .getRawMany();

    const assetIds = results.map(({ assetId }) => assetId);

    await this.assetFaceRepository.delete({ personId: oldPersonId, assetId: In(assetIds) });

    return assetIds;
  }

  async reassignFaces({ oldPersonId, newPersonId }: UpdateFacesData): Promise<number> {
    const result = await this.assetFaceRepository
      .createQueryBuilder()
      .update()
      .set({ personId: newPersonId })
      .where({ personId: oldPersonId })
      .execute();

    return result.affected ?? 0;
  }

  delete(entity: PersonEntity): Promise<PersonEntity | null> {
    return this.personRepository.remove(entity);
  }

  async deleteAll(): Promise<number> {
    const people = await this.personRepository.find();
    await this.personRepository.remove(people);
    return people.length;
  }

  getAllFaces(): Promise<AssetFaceEntity[]> {
    return this.assetFaceRepository.find({ relations: { asset: true }, withDeleted: true });
  }

  getAll(): Promise<PersonEntity[]> {
    return this.personRepository.find();
  }

  getAllWithoutThumbnail(): Promise<PersonEntity[]> {
    return this.personRepository.findBy({ thumbnailPath: '' });
  }

  getAllForUser(userId: string, options?: PersonSearchOptions): Promise<PersonEntity[]> {
    const queryBuilder = this.personRepository
      .createQueryBuilder('person')
      .leftJoin('person.faces', 'face')
      .where('person.ownerId = :userId', { userId })
      .innerJoin('face.asset', 'asset')
      .orderBy('person.isHidden', 'ASC')
      .addOrderBy("NULLIF(person.name, '') IS NULL", 'ASC')
      .addOrderBy('COUNT(face.assetId)', 'DESC')
      .addOrderBy("NULLIF(person.name, '')", 'ASC', 'NULLS LAST')
      .having("person.name != '' OR COUNT(face.assetId) >= :faces", { faces: options?.minimumFaceCount || 1 })
      .groupBy('person.id')
      .limit(peopleLimit);
    if (!options?.withHidden) {
      queryBuilder.andWhere('person.isHidden = false');
    }

    return queryBuilder.getMany();
  }

  getAllWithoutFaces(): Promise<PersonEntity[]> {
    return this.personRepository
      .createQueryBuilder('person')
      .leftJoin('person.faces', 'face')
      .having('COUNT(face.assetId) = 0')
      .groupBy('person.id')
      .withDeleted()
      .getMany();
  }

  getById(personId: string): Promise<PersonEntity | null> {
    return this.personRepository.findOne({ where: { id: personId } });
  }

  getByName(userId: string, personName: string, { withHidden }: PersonNameSearchOptions): Promise<PersonEntity[]> {
    const queryBuilder = this.personRepository
      .createQueryBuilder('person')
      .leftJoin('person.faces', 'face')
      .where('person.ownerId = :userId', { userId })
      .andWhere('LOWER(person.name) LIKE :nameStart OR LOWER(person.name) LIKE :nameAnywhere', {
        nameStart: `${personName.toLowerCase()}%`,
        nameAnywhere: `% ${personName.toLowerCase()}%`,
      })
      .groupBy('person.id')
      .orderBy('COUNT(face.assetId)', 'DESC')
      .limit(20);

    if (!withHidden) {
      queryBuilder.andWhere('person.isHidden = false');
    }
    return queryBuilder.getMany();
  }

  async getStatistics(personId: string): Promise<PersonStatistics> {
    return {
      assets: await this.assetFaceRepository
        .createQueryBuilder('face')
        .leftJoin('face.asset', 'asset')
        .where('face.personId = :personId', { personId })
        .andWhere('asset.isArchived = false')
        .andWhere('asset.deletedAt IS NULL')
        .andWhere('asset.livePhotoVideoId IS NULL')
        .distinct(true)
        .getCount(),
    };
  }

  getAssets(personId: string): Promise<AssetEntity[]> {
    return this.assetRepository.find({
      where: {
        faces: {
          personId,
        },
        isVisible: true,
        isArchived: false,
      },
      relations: {
        faces: {
          person: true,
        },
        exifInfo: true,
      },
      order: {
        fileCreatedAt: 'desc',
      },
      // TODO: remove after either (1) pagination or (2) time bucket is implemented for this query
      take: 1000,
    });
  }

  async getAlbums(personId: string): Promise<AlbumAssetCount[]> {
    const countByAlbums = await this.albumRepository
    .createQueryBuilder('album')
    .select('album.id')
    .addSelect('COUNT(albums_assets.assetsId)', 'asset_count')
    .innerJoin('albums_assets_assets', 'albums_assets', 'albums_assets.albumsId = album.id')
    .innerJoin('asset_faces', 'asset_faces', 'asset_faces.assetId = albums_assets.assetId')
    .innerJoin('person', 'person', 'asset_faces.personId = person.id')
    .where('person.id = :personId', { personId })
    .groupBy('person.id, album.name')
    .orderBy('person.id, album.name')
    .getRawMany();

    return countByAlbums.map<AlbumAssetCount>((albumCount) => ({
      albumId: albumCount['album_id'],
      assetCount: Number(albumCount['asset_count']),
    }));
  }

  create(entity: Partial<PersonEntity>): Promise<PersonEntity> {
    return this.personRepository.save(entity);
  }

  createFace(entity: Partial<AssetFaceEntity>): Promise<AssetFaceEntity> {
    return this.assetFaceRepository.save(entity);
  }

  async update(entity: Partial<PersonEntity>): Promise<PersonEntity> {
    const { id } = await this.personRepository.save(entity);
    return this.personRepository.findOneByOrFail({ id });
  }

  async getFacesByIds(ids: AssetFaceId[]): Promise<AssetFaceEntity[]> {
    return this.assetFaceRepository.find({ where: ids, relations: { asset: true }, withDeleted: true });
  }

  async getRandomFace(personId: string): Promise<AssetFaceEntity | null> {
    return this.assetFaceRepository.findOneBy({ personId });
  }
}
