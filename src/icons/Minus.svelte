<script lang="ts">
  export let size: number = 14
  export let stroke: string = 'currentColor'
  export let strokeWidth: number = 1.5
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 14 14"
  fill="none"
  {stroke}
  stroke-width={strokeWidth}
  stroke-linecap="round"
>
  <line x1="2" y1="7" x2="12" y2="7" />
</svg>
