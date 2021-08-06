import { getDeviceDetails } from '../../utils/api/device-api';
import BleService from '../../libs/ble-server';
import request from '../../utils/request';
// import { dpIdMap } from '../../utils/ts_utils/config';

const BleConnectStatus = {
  notConnected: 'notConnected',
  connecting: 'connecting',
  connected: 'connected',
  connectionFailed: 'connectionFailed'
};

const dpIdMap = {
  single_control: 101,
  all_control: 102,
  map_set: 103
};

// 注入方法
BleService.initFunction(request);

Page({
  /**
   * 页面的初始数据
   */
  data: {
    device_name: '',
    bleInstance: null,
    bleConnectStatus: BleConnectStatus.notConnected,
    dpState: {},
    bleConnect: false,
    dps: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function(options) {
    const { device_id } = options
    const { name, icon } = await getDeviceDetails(device_id)
    console.log('name, icon:::', name, icon);
    // 家庭id
    const home_id = wx.getStorageSync('owner_id')

    // 抽象的蓝牙设备实例
    const instance = BleService.setNewInstance(device_id, home_id);
    // 功能点实例化
    instance.set('_bleIotData', { _ble_dpCodeMap: dpIdMap });
    // 监听蓝牙通信
    instance.onReceivePackage(this.onReceive);
    // 蓝牙连接
    instance.connectBlue();
    // 错误监听
    instance.onError(this.onError);

    this.setData({
      device_name: name,
      icon,
      bleInstance: instance
    });
  },
  onUnload() {
    const { bleInstance } = this.data;
    // 断开蓝牙连接
    bleInstance.connectionBreak();
  },
  // 数据回调
  onReceive(parseReceiveData) {
    const { type, status, dpState, deviceId } = parseReceiveData;

    this.setData({
      dpState,
      status,
      type,
      deviceId
    });
    if (type === 'connect' && status === 'fail') {
      if (deviceId) {
        return { msg: '连接失败 或 连接后又断开' }
      } else {
        return { msg: '未发现当前蓝牙设备' }
      }
    } else if (type === 'connect' && status === 'connected') {
      // 连接成功
      wx.showToast({
        title: '蓝牙连接成功',
        icon: 'success',
        duration: 2000
      })        
    } else if (!(deviceId in parseReceiveData)) {
      // 一般为dp上报事件，可在此处处理数据or走业务逻辑
      dpState && this.handleData();
    }
  },
  // 处理上报数据
  handleData() {
    const { dpState } = this.data;
    console.log(dpState);
  },
  onError(err) {
    console.log('onError:::', err);
  },
  // 清屏
  clean() {
    // 下发指令关闭所有灯泡
    this.data.bleInstance.sendDp({ dpCode: 'all_control', dpValue: '000000' });
  },
  // 初始化蛇身和食物
  async init() {
    // 假设编号为 00 、 01、 02 的三个灯泡（颜色为 0xffff00）为蛇身，编号为 09 的灯泡（颜色为 0xff00ff）为食物
    const dpData = [
      { dpCode: 'single_control', dpValue: '00ffff00' },
      { dpCode: 'single_control', dpValue: '01ffff00' },
      { dpCode: 'single_control', dpValue: '02ffff00' },
      { dpCode: 'single_control', dpValue: '09ff00ff' }
    ];
    const res = await this.data.bleInstance.sendDp(dpData);
    res.success && console.log('init success');
  },
  // 贪吃蛇移动下发dp
  async move({ currentTarget }) {
    const { dataset: { direction } } = currentTarget;
    switch (direction) {
      case 'up':
        // 假设向上移动时，灭掉 00 号灯，开启 04 号灯
        const res = await this.data.bleInstance.sendDp([
          { dpCode: 'single_control', dpValue: '00000000' },
          { dpCode: 'single_control', dpValue: '04ffff00' },
        ]);
        res.success && console.log('move success');
        break;
      case 'down':
        break;
      case 'left':
        break;
      case 'right':
        break;
    }
  },
  // 蓝牙连接
  connect: function() {
    this.data.bleInstance.reconnectBlue()
  },
  // 跟蓝牙设备解绑，解绑完成可以重新配网，注意，该api只能与设备断开连接，想从设备列表里干掉这个设备，需要调云端接口哦
  unboundBlue: function() {
    this.data.bleInstance.unboundBlue();
  }
});
