<script lang="ts">
  export let size: number = 20;
  export let stroke: string = "currentColor";
  export let strokeWidth: number = 1.5;
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  {stroke}
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <circle cx="6" cy="6" r="2" />
  <circle cx="18" cy="6" r="2" />
  <circle cx="6" cy="18" r="2" />
  <path d="M6 8v8M8 6h7a2 2 0 0 1 2 2v2" />
</svg>
