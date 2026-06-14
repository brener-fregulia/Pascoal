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
  <circle cx="11" cy="11" r="7" />
  <line x1="16.5" y1="16.5" x2="22" y2="22" />
</svg>
