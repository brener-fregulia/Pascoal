<script lang="ts">
  export let size: number = 20
  export let stroke: string = 'currentColor'
  export let strokeWidth: number = 1.5
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
  <rect x="3" y="4" width="18" height="16" rx="2" />
  <line x1="15" y1="4" x2="15" y2="20" />
</svg>
