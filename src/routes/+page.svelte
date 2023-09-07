<script>
    import NavigationBar from "$lib/components/NavigationBar/Bar.svelte";
</script>

<NavigationBar />

<h1 class="title">SnailTool</h1>

<div class="content">
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
        width: 100%;
        text-align: center;
    }
    .content {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .footer {
        opacity: 0.5;
        font-size: small;
        position: absolute;
        left: 2px;
        bottom: 2px;
        margin-block: 0;
    }
</style>
