<template>
  <div class="what-is-mew">

    <div class="block-progressbar">
      <dir class="block-progressbar__container">
        <div class="block-progressbar__title">
          {{ $t("start_foundstore.about") }}
        </div>
        <div class="block-progressbar__progressbar">
          <div :class="progressBarValue"/>
        </div>
        <div class="block-progressbar__content">
          <h4>{{ $t("start_foundstore.title") }}</h4>
          <p>
            {{ $t("start_foundstore.content") }}
          </p>
          <div class="block-progressbar__warning">
            {{ $t("start_foundstore.warning") }}
          </div>
          <div class="block-progressbar__sliding-switch-expender">
            <div class="title">
              <h4>{{ $t("start_foundstore.blockchain_title") }}</h4>
              <div class="sliding-switch sliding-switch-white">
                <label class="switch">
                  <input
                    type="checkbox"
                    @click="expenderContentShow = !expenderContentShow">
                  <span class="slider round"/>
                </label>
              </div>
            </div>
            <div
              v-if="expenderContentShow"
              class="content">
              <p>
                {{ $t("start_foundstore.blockchain_content_1") }}
              </p>

              <p>
                {{ $t("start_foundstore.blockchain_content_2") }} <a
                  href=""
                  target="_blank">here</a>.
              </p>
            </div>

          </div>
        </div>
      </dir>
    </div>

  </div>
</template>

<script>
export default {
  props: {
    progressBarValue: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      expenderContentShow: false
    };
  }
};
</script>

<style lang="scss" scoped>
@import '../BlockWithProgressBar.scss';
</style>
