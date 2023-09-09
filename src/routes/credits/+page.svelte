<script>
    import NavigationBar from "$lib/components/NavigationBar/Bar.svelte";

    const data = [
        {
            name: "JeremyGamer13",
            for: "Application Code & UI Layout",
            image: "https://media.discordapp.net/attachments/914411539887456296/1077820194728181842/projile_pijture.png",
        },
        {
            name: "Desmond",
            for: "UI Design / Code",
            image: "https://media.discordapp.net/attachments/914411539887456296/1083207542643114024/E7-kfF-XMAA9S-v.png",
        },
        {
            name: "RGC Exists",
            for: "GS2ML Developer & Directing Specific Features",
            image: "https://media.discordapp.net/attachments/914411539887456296/1085060296424574986/566b37fc1920df9e3d041ef442a19c38.png",
        },
        {
            name: "cgytrus",
            for: "GMML Developer",
            image: "https://avatars.githubusercontent.com/u/30120687?v=4",
        },
        {
            name: "OmegaMetor",
            for: "GS2ML Developer & GMML Contributor",
            image: "https://avatars.githubusercontent.com/u/42892531?v=4",
        },
    ];
</script>

<NavigationBar />

<div class="title-wrapper">
    <img src="/logo.png" alt="SnailTool" class="title" />
</div>

{#each data as entry}
    <div class="entry-wrapper">
        <img src={entry.image} alt={entry.name} />
        <div class="entry-details">
            <h2>{entry.name}</h2>
            <p>{entry.for}</p>
        </div>
    </div>
{/each}

<p class="footer">st-v2.0; svelte - tauri</p>

<style>
    .title-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
    }
    .title {
        margin-top: 8px;
        height: 128px;
    }

    .entry-wrapper {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin: 8px 4px;
    }
    .entry-wrapper > img {
        margin-right: 10px;
        border: 2px solid #f0c0e3;
        border-radius: 4096px;
        width: 96px;
        height: 96px;
    }
    .entry-details {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }
    .entry-details * {
        margin-block: 0;
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
