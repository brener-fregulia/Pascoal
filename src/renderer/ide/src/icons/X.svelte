<script lang="ts">
  export let size: number = 10
  export let stroke: string = 'currentColor'
  export let strokeWidth: number = 1.5
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 10 10"
  fill="none"
  {stroke}
  stroke-width={strokeWidth}
  stroke-linecap="round"
>
  <line x1="2" y1="2" x2="8" y2="8" />
  <line x1="8" y1="2" x2="2" y2="8" />
</svg>
