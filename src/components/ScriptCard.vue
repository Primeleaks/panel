<template>
  <img
      :src="script.image"
      :alt="script.title"
      class="script-image"
      @error="handleError"
  />
</template>

<script>
export default {
  props: {
    script: {
      type: Object,
      required: true
    }
  },
  methods: {
    handleError(event) {
      const DEFAULT_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN88B8AAsUB4ZtvXtIAAAAASUVORK5CYII=';
      event.target.src = DEFAULT_IMAGE;
    }
  }
}
</script>