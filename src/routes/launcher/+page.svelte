<script>
    import NavigationBar from "$lib/components/NavigationBar/Bar.svelte";
    import SaveSlot from "$lib/components/SaveSlot/Button.svelte";

    import localforage from "localforage";

    // profiles
    let profiles = [];
    localforage.getItem("st:profiles").then((profiless) => {
        if (!Array.isArray(profiless)) return;
        profiles = profiless;
    });
</script>

<NavigationBar />

{#each profiles as profile}
    <SaveSlot header={profile.name} />
{/each}
<SaveSlot header={"New Profile"} plus={true} />
