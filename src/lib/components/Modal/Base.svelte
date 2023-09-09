<script>
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let title = "";
    export let width = 50;
    export let style = "";

    let backing;
    function dismiss(event) {
        if (event.target === backing) {
            dispatch("close");
        }
    }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div bind:this={backing} on:click={dismiss} class="backing">
    <div
        class="modal"
        style={`${
            typeof width !== "undefined"
                ? `width: ${width}%; height: ${width}%;`
                : ""
        }${style}`}
    >
        {#if title}
            <div class="modal-title">
                <h2>{title}</h2>
            </div>
        {/if}
        <div class={`modal-content${title ? "" : " modal-content-notitle"}`}>
            <slot />
        </div>
    </div>
</div>

<style>
    .backing {
        position: fixed;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.375);
        z-index: 99999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .modal {
        position: relative;
        border: 2px solid #f0c0e3;
        background: rgb(14, 0, 14);
        border-radius: 6px;
        width: 50%;
        height: 50%;
        overflow: hidden;
    }

    .modal-title {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 3em;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .modal-title * {
        margin-block: 0;
        text-align: center;
    }
    .modal-content {
        position: absolute;
        left: 0;
        top: 3em;
        width: 100%;
        height: calc(100% - 3em);
    }
    .modal-content-notitle {
        top: 0;
        height: 100%;
    }
</style>
