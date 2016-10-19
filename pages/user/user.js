// user.js

var Api = require('../../utils/api.js');

var WARP_SECOND = 1000 * 60;
var CACHED_TIME = WARP_SECOND * 2; // sec

Page({
  data: {
    title: 'User',
    user: {},
    photos: [],
    contacts: [],
    loading: true,
    hasMore: true,
    id: '',
    rpp: 20,
    hideCamera: true,
    hideLens: true,
    hideCity: true
  },
  lookPhoto: function(e) {
    var id = e.currentTarget.id,
      url = '../detail/detail?id=' + id;
    wx.navigateTo({
      url: url
    })
  },
  loadMore: function(e) {
    console.log('down');
    var hasMore = false;
    this.fetchGallery(this.data.id, true);
    hasMore = true;
    this.setData({
      hasMore: hasMore
    })
  },
  fetchUser: function(id) {
    var that = this;
    console.log(id);
    wx.request({
      url: Api.showUser(id),
      data: {
        consumer_key: Api.getConsumerKey()
      },
      success: function(res) {
        var user = res.data.user;
        var objC = user.contacts;
        var arrayC = [];
        for (var key in objC){
          arrayC.push([key, objC[key]]);
        }

        that.setData({
          id: id,
          user: user,
          hideCamera: Api.isNone(user.camera),
          hideLens: Api.isNone(user.lens),
          hideCity: Api.isNone(user.city),
          contacts: arrayC
        });
        that.fetchGallery(id);
      }
    });
  },
  initData: function(id){
    var cachedPhotos = wx.getStorageSync('userphotos');

    if (!cachedPhotos) {
      console.log('y');
      this.fetchGallery(id, false);
    } else {
      console.log('n');
      var nowTs = Date.now();
      var oldTs = parseInt(wx.getStorageSync('requestUserTs') || 0);

      if (nowTs - oldTs > CACHED_TIME || !oldTs) {
        console.log('n1');
        this.fetchGallery(id, false);
      } else {
        console.log('n2');
        this.setData({
          loading: false,
          photos: cachedPhotos
        })
      }
    }
  },
  fetchGallery: function(id, more) {
    console.log('fetchGallery');
    var that = this;
    if (!more) {
      more = false;
    }

    var theRPP = that.data.rpp;
    console.log(id);
    wx.request({
      url: Api.getPhotos(),
      data: {
        feature: 'user',
        user_id: id,
        consumer_key: Api.getConsumerKey(),
        sort: 'created_at',
        sort_direction: 'desc',
        image_size: '3',
        include_store: 'store_download',
        include_states: 'voted',
        rpp: theRPP
      },
      success: function(res) {
        var fetchedData = res.data.photos;

        if (more) {
          console.log('a');
          var newData = that.data.photos;
          newData.push.apply(newData, fetchedData.slice(theRPP - 20, theRPP));
        } else {
          console.log('b');
          var newData = fetchedData;
        }

        wx.setStorageSync('userphotos', newData);
        wx.setStorageSync('requestUserTs', Date.now());

        that.setData({
          photos: newData,
          loading: false,
          rpp: that.data.rpp + 20
        })
      }
    });
  },
  onLoad: function(options) {
    this.fetchUser(options.id);
  }
})
