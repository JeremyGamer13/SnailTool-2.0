<script>
    import Tab from "$lib/components/NavigationBar/Tab.svelte";
</script>

<div class="bar">
    <div style="margin-left: 4px;" />
    <Tab href="/">Home</Tab>
    <Tab href="/editor">Level Editor</Tab>
    <Tab href="/save">Save Editor</Tab>
    <Tab href="/launcher">Launcher</Tab>
    <Tab href="/settings">Settings</Tab>
    <Tab href="/credits">Credits</Tab>
</div>
<div class="margin" />

<style>
    .bar {
        position: absolute;
        left: 0px;
        top: 6px;
        width: 100%;
        height: 20px;
        display: flex;
        flex-direction: row;
        border-bottom: 1px solid #85448e;
    }
    .margin {
        width: 100%;
        height: 26px;
    }
</style>
