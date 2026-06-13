<script>
  import Landing from "./Landing.svelte";
  import Creator from "./Creator.svelte";

  // Si l'URL contient un state partagé, aller directement au Creator
  const hasSharedState = window.location.hash.includes("state=");
  let view = hasSharedState ? "creator" : "landing";
</script>

{#if view === "landing"}
  <Landing onEnter={() => view = "creator"} />
{:else}
  <Creator onBack={() => view = "landing"} />
{/if}
