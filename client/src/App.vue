<template>
  <div id="app">
    <Home/>
    <footer>&copy; Serotonin Software 2019</footer>
  </div>
</template>

<script>
import Home from './views/Home'

export default {
  components: { Home },
  data() {
    return {}
  },
}
</script>

<style lang="scss">
#app {
  font-family: 'Nunito', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  width: 680px;
  margin: 40px auto 0;
  color: $darkGrey;
}

#nav {
  padding: 30px;
  a {
    font-weight: bold;
  }
}

a, button.link {
  color: $inactiveLink;
  &.router-link-exact-active {
    color: $activeLink;
  }
  &:hover {
    color: $activeLink;
  }
}

button {
  cursor: pointer;

  &:disabled {
    background-color: $grey !important;
    cursor: not-allowed;
  }

  &.spinner {
    display: none;
  }

  &.loading {
    position: relative;
    cursor: not-allowed;
    color: $brandBlue;

    .spinner {
      display: block;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%,-50%);
      width: 64px;
      text-align: center;
      line-height: 0;

      > div {
        width: 16px;
        height: 16px;
        background-color: $brandBlue;

        border-radius: 100%;
        display: inline-block;
        -webkit-animation: sk-bouncedelay 1.4s infinite ease-in-out both;
        animation: sk-bouncedelay 1.4s infinite ease-in-out both;
      }

      .bounce1 {
        -webkit-animation-delay: -0.32s;
        animation-delay: -0.32s;
      }

      .bounce2 {
        -webkit-animation-delay: -0.16s;
        animation-delay: -0.16s;
        background-color: $brandGreen;
      }

      @-webkit-keyframes sk-bouncedelay {
        0%, 80%, 100% { -webkit-transform: scale(0); }
        40% { -webkit-transform: scale(1.0); }
      }

      @keyframes sk-bouncedelay {
        0%, 80%, 100% {
          -webkit-transform: scale(0);
          transform: scale(0);
        }
        40% {
          -webkit-transform: scale(1.0);
          transform: scale(1.0);
        }
      }
    }
  }

  &.link {
    border: none;
    background: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
}

.error-message {
  color: $brandRed;
  font-weight: bolder;
}

.form-component {
  text-align: left;
  font-size: smaller;
  margin-bottom: 20px;
  width: 100%;
  display: block;

  label {
    display: block;
    font-weight: bold;
    text-transform: uppercase;
    margin: 0 10px;
  }

  input, select, textarea, button {
    display: block;
    box-sizing: border-box;
    width: 100%;
    border-radius: 5px;
    border: 1px solid $grey;
    font-weight: 400;
    font-size: 15px;
    padding: 0 10px;
    transition: all 0.3s;
    height: 40px;
  }

  input[type=checkbox] {
    height: 20px;
    display: inline-block;
    width: 20px;
    vertical-align: middle;
  }

  .checkbox-text {
    font-size: 16px;
    vertical-align: middle;
  }

  button {
    background-color: $brandBlue;
    color: white;
    text-transform: uppercase;
  }

  input:focus, select:focus, textarea:focus, button:focus {
    border: 1px solid #b3b3b3;
    -webkit-box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
            box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
  }

  input:hover, select:hover, textarea:hover, button {
    border: 1px solid #b3b3b3;
  }

  button:hover {
    background-color: darken($brandBlue, 20%);
  }

  .hint, .error-message {
    margin: 0 10px;
  }
}

footer {
  margin-top: 20px;
  font-size: smaller;
  color: $grey;
}

.success-message {
  color: $brandBlue;
}

.narrow {
  width: 400px;
  margin: 0 auto;
}
</style>
