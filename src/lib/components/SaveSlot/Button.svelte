<script>
    import { createEventDispatcher } from "svelte";
    import IconAdd from "./plus.png";

    const dispatch = createEventDispatcher();

    function event() {
        dispatch("click");
    }

    export let plus = false;
    export let icon = "";
    export let style = "";
    export let header = "";
    export let footer = "";
</script>

<button {style} on:click={event}>
    <p class="header">{header}</p>
    {#if plus}
        <img draggable="false" src={IconAdd} alt="New" />
    {/if}
    {#if icon}
        <img draggable="false" src={icon} alt="New" />
    {/if}
    <slot />
    <p class="footer">{footer}</p>
</button>

<style>
    button {
        position: relative;
        width: 180px;
        height: 275px;
        border-radius: 0;
        user-select: none;
    }
    button img {
        width: 65px;
        height: 65px;
        image-rendering: pixelated;
    }

    .header,
    .footer {
        position: absolute;
        left: 0;
        width: 100%;
        color: white;
        font-size: 22px;
        text-align: center;
    }
    .header {
        top: 4px;
    }
    .footer {
        bottom: 4px;
    }
</style>
