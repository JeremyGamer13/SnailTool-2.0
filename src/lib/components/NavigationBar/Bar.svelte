<script>
    import Tab from "$lib/components/NavigationBar/Tab.svelte";
</script>

<div class="bar">
    <Tab href="/">Home</Tab>
    <Tab href="/editor">Editor</Tab>
</div>

<style>
    .bar {
        display: flex;
        flex-direction: row;
        border-bottom: 1px solid rgba(0, 0, 0, 0.5);
        padding-bottom: 2px;
        margin-bottom: 2px;
    }
</style>
