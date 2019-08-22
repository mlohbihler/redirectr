<!-- Copyright Serotonin Software 2019 -->
<template>
  <div>
    <img alt="RedirectR logo" src="../assets/redirectr-lg.png">

    <h1>Redirect like a champ!</h1>
    <p>
      RedirectR is a service that does 301, 302, or Javascript web page redirects. To use it, you
      need to be able to add a TXT record set to your domain. That's it. Sure, there are other ways
      to do this, like proprietary solutions in hosting services and the occasional control panel.
      But RedirectR is almost always way simpler, and works no matter what your situation.
    </p>
    <p>
      This is open source software. Find the repository at
      <a href="https://github.com/mlohbihler/redirectr">https://github.com/mlohbihler/redirectr</a>.
    </p>
    <form @submit.prevent="submitHost" novalidate>
      <FormText label="Domain name" type="text" placeholder="The domain name from which to redirect" v-model="domain" autoFocus/>
    </form>
    <Loading v-if="readInProgress" />
    <div v-if="hostInfo" class="hostInfo">
      <div v-if="!hostInfo.active && hostInfo.staged === 0">
        There is no existing redirect data for <strong>{{ hostname }}</strong>. <button class="link" @click="refresh">Refresh</button>
      </div>
      <div v-if="hostInfo.active" class="active-data">
        <p><strong>Current redirect infomation for '{{ hostname }}'. <button class="link" @click="refresh">Refresh</button></strong></p>
        <label>Target URL:</label><span>{{ hostInfo.active.targetUrl }}</span><br/>
        <label>Redirect type:</label><span>{{ hostInfo.active.redirectType }}</span><br/>
        <label>Append original path:</label><span>{{ hostInfo.active.appendOriginalUrl }}</span><br/>
        <label>Last hit:</label><span>{{ hostInfo.active.lastHit || 'none' }}</span><br/>
        <template v-if="hostInfo.active.lastHit">
          <label>Since last hit:</label><span>{{ sinceLastHit() }}</span><br/>
        </template>
        <p>If your redirects are not working, ensure that <strong>{{ hostname }}</strong>'s 'A' record(s) point to
          <strong><ClipboardCopy :str="thisIp"/></strong>
        </p>
      </div>
      <div v-if="hostInfo.staged === 1">There is <strong>1</strong> staged record.</div>
      <div v-if="hostInfo.staged > 1">There are <strong>{{ hostInfo.staged }}</strong> staged records.</div>
      <div v-if="!uuid" class="stage">
        <p class="emph">
          Complete the form below to stage a new redirect record. After doing so, you will have 10 minutes to add a TXT record to the
          <strong>{{ hostname }}</strong> domain with the given code for the staged record to be accepted.
        </p>
        <form @submit.prevent="submitStage" novalidate>
          <FormText label="Target URL" type="text" placeholder="The URL to which to redirect" v-model="targetUrl" :errorMsg="targetUrlError"
            hint="Enter a full URL. Or just enter the domain name and the protocol (http or https) will be the same as the original request."/>
          <FormSelect label="Redirect type" :options="redirectOpts" v-model="redirectType"
            hint="Browsers will store 301 redirects permanently; use this only when you are sure your configuration is correct."/>
          <FormCheck label="Append original path" v-model="appendOriginalUrl" placeholder="Apply the URL path from the original request to the redirect"/>
          <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
          <FormButton :disabled="stageInProgress" :class="{ progress: stageInProgress }">Stage redirect</FormButton>
        </form>
      </div>
      <div v-else class="uuid">
        <p class="emph">Your redirect information has been staged. There are now three things you need to do to make this information active.</p>
        <p class="emph">
          First, within 10 minutes, you need to add a TXT record to your domain with the value
          <strong><ClipboardCopy :str="'redirectr-' + uuid"/></strong>. RedirectR will watch for this record, and once it
          finds it (thus proving that you have control of the domain) it will make the matching staged record active. RedirectR
          will check for changes about once a minute, but it can take a while to find your entries depending on DNS TTL settings.
        </p>
        <p class="emph">
          Second, you need to point your old domain's 'A' record(s) to point to this service at
          <strong><ClipboardCopy :str="thisIp"/></strong>
        </p>
        <p class="emph">
          Third, test if everything works.
        </p>
        <p class="emph">
          Note: if this domain has existing staged records you will need wait for them to clear before your latest staging will have a chance to be activated.
          RedirectR only tries to activate the oldest staged record entered. Once it expires and gets deleted RedirectR will try to activate the next oldest
          record. You cannot delete or overwrite them yourself because they may not have been entered by you... RedirectR doesn't know.
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import ClipboardCopy from '../components/ClipboardCopy'
import FormButton from '../components/FormButton'
import FormCheck from '../components/FormCheck'
import FormSelect from '../components/FormSelect'
import FormText from '../components/FormText'
import Loading from '../components/Loading'

import { get, post } from '@/api'

export default {
  components: { ClipboardCopy, FormButton, FormCheck, FormSelect, FormText, Loading },
  data() {
    return {
      domain: '',
      readInProgress: false,
      hostInfo: null,

      hostname: '',
      targetUrl: '',
      redirectType: '302',
      appendOriginalUrl: true,
      stageInProgress: false,

      targetUrlError: null,
      errorMessage: null,
      uuid: null,

      redirectOpts: [
        { value: '301', label: '301 (Moved permanently)' },
        { value: '302', label: '302 (Moved temporarily)' },
        { value: 'location', label: 'Javascript (client-side) redirect' }
      ]
    }
  },
  computed: {
    thisIp() {
      return process.env.VUE_APP_THIS_IP
    }
  },
  methods: {
    submitHost() {
      if (!this.domain.trim()) {
        return
      }
      this.hostname = this.domain.trim()
      this.refresh()
    },
    async refresh() {
      if (!this.readInProgress) {
        this.readInProgress = true
        const result = await get(`/redirects/${this.hostname}`)
        this.readInProgress = false
        this.hostInfo = result
      }
    },
    async submitStage() {
      this.stageInProgress = true
      this.targetUrlError = null
      this.errorMessage = null

      const result = await post(`/redirects/${this.hostname}`, {
        targetUrl: this.targetUrl,
        redirectType: this.redirectType,
        appendOriginalUrl: this.appendOriginalUrl,
      })
      this.stageInProgress = false

      if (result.error) {
        if (result.error.code === 'redirect-create-2') {
          this.targetUrlError = 'Please enter a target URL value'
        } else {
          this.errorMessage = result.error.message
        }
      } else {
        this.uuid = result.uuid
      }
    },
    sinceLastHit(now = Date.now()) {
      let diff = now - new Date(this.hostInfo.active.lastHit).getTime()
      if (diff < 10000) {
        return 'Less than 10 seconds'
      }
      if (diff < 60000) {
        return 'Less than 1 minute'
      }
      diff /= 60000
      if (diff < 60) {
        return `${Math.round(diff)} minutes`
      }
      diff /= 60
      if (diff < 24) {
        return `${Math.round(diff)} hours`
      }
      diff /= 24
      return `${Math.round(diff)} days`
    }
  }
}
</script>

<style scoped lang="scss">
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: $brandBlue;
}
.center {
  display: inline-block;
}
.hostInfo {
  text-align: left;
}
.active-data {
  margin-bottom: 10px;

  label {
    display: inline-block;
    width: 200px;
    text-align: right;
    padding-right: 10px;
  }

  span {
    font-weight: bold;
  }
}
.stage {
  margin-top: 20px;
}
.emph {
  margin-bottom: 10px;
  font-style: italic;
}
.uuid {
  margin-top: 20px;
}
</style>
