<script>
    import NavigationBar from "$lib/components/NavigationBar/Bar.svelte";
</script>

<NavigationBar />

<div class="content">
    <img src="/logo.png" alt="SnailTool" class="title" />

    <div>
        <p>Game Directory: None</p>
        <button>Auto-Detect</button>
        <button>Browse...</button>
    </div>
    <br />
    <div>
        <p>Save Directory: None</p>
        <button>Auto-Detect</button>
        <button>Browse...</button>
    </div>
</div>

<p class="footer">st-v2.0; svelte - tauri</p>

<style>
    .title {
        margin-top: 8px;
        height: 128px;
    }
    .content {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .footer {
        position: absolute;
        left: 2px;
        bottom: 2px;
        opacity: 0.5;
        margin-block: 0;
        font-size: x-small;
        user-select: none;
        font-style: italic;
        text-transform: uppercase;
        pointer-events: none;
    }
</style>
