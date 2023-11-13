<script lang="ts">
  import { fade } from 'svelte/transition';
  import { onDestroy, onMount } from 'svelte';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import { api, AssetResponseDto } from '@api';
  import { notificationController, NotificationType } from '../shared-components/notification/notification';
  import { useZoomImageWheel } from '@zoom-image/svelte';
  import { photoZoomState } from '$lib/stores/zoom-image.store';
  import { isWebCompatibleImage } from '$lib/utils/asset-utils';
  import { shouldIgnoreShortcut } from '$lib/utils/shortcut';

  export let asset: AssetResponseDto;
  export let element: HTMLDivElement | undefined = undefined;
  export let haveFadeTransition = true;

  let imgElement: HTMLDivElement;
  let assetData: string;
  let abortController: AbortController;
  let hasZoomed = false;
  let showpeopleFrame = false;
  let peopleFrameData: { imageHeight: 0; imageWidth: 0; x1: 0; x2: 0; y1: 0; y2: 0 };
  let copyImageToClipboard: (src: string) => Promise<Blob>;
  let canCopyImagesToClipboard: () => boolean;
  let divWidth = 0,
    divHeight = 0;
  onMount(async () => {
    // Import hack :( see https://github.com/vadimkorr/svelte-carousel/issues/27#issuecomment-851022295
    // TODO: Move to regular import once the package correctly supports ESM.
    const module = await import('copy-image-clipboard');
    copyImageToClipboard = module.copyImageToClipboard;
    canCopyImagesToClipboard = module.canCopyImagesToClipboard;
  });

  onDestroy(() => {
    abortController?.abort();
  });

  const loadAssetData = async ({ loadOriginal }: { loadOriginal: boolean }) => {
    try {
      abortController?.abort();
      abortController = new AbortController();

      const { data } = await api.assetApi.serveFile(
        { id: asset.id, isThumb: false, isWeb: !loadOriginal, key: api.getKey() },
        {
          responseType: 'blob',
          signal: abortController.signal,
        },
      );

      if (!(data instanceof Blob)) {
        return;
      }

      assetData = URL.createObjectURL(data);
    } catch {
      // Do nothing
    }
  };

  const handleKeypress = async (event: KeyboardEvent) => {
    if (shouldIgnoreShortcut(event)) {
      return;
    }
    if (window.getSelection()?.type === 'Range') {
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key === 'c') {
      await doCopy();
    }
  };

  const doCopy = async () => {
    if (!canCopyImagesToClipboard()) {
      return;
    }

    try {
      await copyImageToClipboard(assetData);
      notificationController.show({
        type: NotificationType.Info,
        message: 'Copied image to clipboard.',
        timeout: 3000,
      });
    } catch (err) {
      console.error('Error [photo-viewer]:', err);
      notificationController.show({
        type: NotificationType.Error,
        message: 'Copying image to clipboard failed.',
      });
    }
  };

  const doZoomImage = async () => {
    setZoomImageWheelState({
      currentZoom: $zoomImageWheelState.currentZoom === 1 ? 2 : 1,
    });
  };

  const {
    createZoomImage: createZoomImageWheel,
    zoomImageState: zoomImageWheelState,
    setZoomImageState: setZoomImageWheelState,
  } = useZoomImageWheel();

  zoomImageWheelState.subscribe((state) => {
    photoZoomState.set(state);

    if (state.currentZoom > 1 && isWebCompatibleImage(asset) && !hasZoomed) {
      hasZoomed = true;
      loadAssetData({ loadOriginal: true });
    }
  });

  $: if (imgElement) {
    createZoomImageWheel(imgElement, {
      maxZoom: 10,
      wheelZoomRatio: 0.2,
    });
  }

  let cropOptions: { top: any; left: any; height: any; width: any };
  export const handlePeopleHover = (ev: any) => {
    showpeopleFrame = true;
    peopleFrameData = ev.detail;

    const { x1, x2, y1, y2, imageWidth, imageHeight } = peopleFrameData;
    let widthRatio = divWidth / imageWidth;
    let heightRatio = divHeight / imageHeight;

    // console.log('handlePeopleHover', peopleFrameData);
    // console.log('Height', divHeight);
    // console.log('Width', divWidth);

    const halfWidth = (x2 * widthRatio - x1 * widthRatio) / 2;
    const halfHeight = (y2 * heightRatio - y1 * heightRatio) / 2;
    const middleX = Math.round(x1 * widthRatio + halfWidth);
    const middleY = Math.round(y1 * heightRatio + halfHeight);
    // zoom out 10%
    const targetHalfSize = Math.floor(Math.max(halfWidth, halfHeight) * 1.1);
    // get the longest distance from the center of the image without overflowing
    const newHalfSize = Math.min(
      middleX - Math.max(0, middleX - targetHalfSize),
      middleY - Math.max(0, middleY - targetHalfSize),
      Math.min(imageWidth * widthRatio - 1, middleX + targetHalfSize) - middleX,
      Math.min(imageHeight * heightRatio - 1, middleY + targetHalfSize) - middleY,
    );
    cropOptions = {
      left: middleX - newHalfSize,
      top: middleY - newHalfSize,
      width: newHalfSize * 2,
      height: newHalfSize * 2,
    };
  };
</script>

<svelte:window on:keydown={handleKeypress} on:copyImage={doCopy} on:zoomImage={doZoomImage} />

<div
  bind:this={element}
  transition:fade={{ duration: haveFadeTransition ? 150 : 0 }}
  class="flex h-full select-none place-content-center place-items-center"
>
  {#await loadAssetData({ loadOriginal: false })}
    <LoadingSpinner />
  {:then}
    <div bind:this={imgElement} class="h-full w-full" bind:offsetWidth={divWidth} bind:offsetHeight={divHeight}>
      {#if showpeopleFrame}
        <div
          style={`position: absolute; border: solid 10px red; border-radius: 40px;
                  top:${cropOptions.top}px;
                  left:${cropOptions.left}px;
                  height:${cropOptions.height}px;
                  width:${cropOptions.width}px;`}
        />
      {/if}

      <img
        transition:fade={{ duration: haveFadeTransition ? 150 : 0 }}
        src={assetData}
        alt={asset.id}
        class="h-full w-full object-contain"
        draggable="false"
      />
    </div>
  {/await}
</div>
