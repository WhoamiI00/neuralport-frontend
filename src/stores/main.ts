import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useMainStore = defineStore('main', () => {
  const splashScreen = ref(false);

  return {
    splashScreen,
  };
});
