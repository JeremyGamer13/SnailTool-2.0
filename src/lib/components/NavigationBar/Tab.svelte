<script>
    export let href = "/";
</script>

<a {href} class="link">
    <button>
        <slot />
    </button>
</a>

<style>
    button {
        border-width: 1px;
        border-radius: 0;
        border-bottom-width: 0px;
        border-top-right-radius: 8px;
        border-top-left-radius: 8px;
        background-color: rgb(14, 0, 14);
        border-color: #85448e;
        border-style: solid;
        height: 20px;
        transition-duration: 0.5s;
        cursor: pointer;
    }
    button:focus,
    button:hover {
        background-color: rgb(36, 0, 36);
        transition-duration: 0.5s;
        outline-style: none;
    }
    button:active {
        background-color: #85448e;
        transition-duration: 0s;
    }

    .link {
        margin-right: 4px;
    }
</style>
