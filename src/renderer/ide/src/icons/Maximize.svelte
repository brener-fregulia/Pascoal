<script lang="ts">
  export let size: number = 14;
  export let stroke: string = "currentColor";
  export let strokeWidth: number = 1.5;
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 14 14"
  fill="none"
  {stroke}
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <rect x="2.5" y="2.5" width="9" height="9" rx="1.5" />
</svg>
