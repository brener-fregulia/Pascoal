<script lang="ts">
  export let size: number = 24
  export let stroke: string = 'currentColor'
  export let strokeWidth: number = 1.5
</script>

<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke-linecap="round"
  stroke-linejoin="round"
  width={size}
  height={size}
  {stroke}
  stroke-width={strokeWidth}
>
  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
</svg>
