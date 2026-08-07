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
  <path
    d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
  />
  <line x1="12" y1="18" x2="12" y2="12" />
  <line x1="9" y1="15" x2="15" y2="15" />
</svg>
