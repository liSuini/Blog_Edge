import { defineStore } from 'pinia'
import { getAboutContent, getSiteInfo } from '@/api/config'

export const useSiteStore = defineStore('site', {
  state: () => ({
    aboutContent: '',
    loaded: false,
    siteInfo: {
      site_name: 'My Blog',
      author_name: '博主',
      author_avatar: '',
      author_bio: '',
      announcement: '',
    },
    siteInfoLoaded: false,
  }),

  actions: {
    async loadAbout() {
      if (this.loaded) return
      try {
        const res = await getAboutContent()
        this.aboutContent = res.data.content
        this.loaded = true
      } catch (e) {
        this.loaded = true
      }
    },

    async loadSiteInfo() {
      if (this.siteInfoLoaded) return
      try {
        const res = await getSiteInfo()
        this.siteInfo = { ...this.siteInfo, ...res.data }
        this.siteInfoLoaded = true
      } catch (e) {
        this.siteInfoLoaded = true
      }
    },
  },
})