# 涂鸦智能 - 蓝牙SDK 项目说明文档
当前 SDK 为根据涂鸦蓝牙协议（3.x/4.x）提供的基本业务能力封装，包括蓝牙连接建立、dp 下发、设备的 ota 升级等能力。   

### 1、引入   
```js
import BleService from ''
```   
> BleService 是一个实例对象，该实例维护了下文所提到的设备实例列表与api请求对象等数据。

### 2、使用

#### 2.1、初始化api请求对象
```js
BleService.initFunction(request)
```
> request：接口请求方法。  
由于在蓝牙配对绑定流程中，需要从云端拉取蓝牙连接所需要的数据（具体数据详见蓝牙协议，这里不赘述），因此本sdk内存在一些接口调用。接口地址与参数sdk已写好，调用者要做的就是传入接口请求方法来让sdk顺利发起请求。

#### 2.2、创建蓝牙设备实例

```js
const instance = BleService.setNewInstance(device_id, home_id)
```

- 参数说明

  | 字段   | 数据类型 | 说明                |
  | :----- | :------- | :------------------ |
  | device_id  | string   | 蓝牙设备 id         |
  | home_id | number   | 蓝牙设备所在家庭 id |

> setNewInstance：生成蓝牙实例。   
通过调用该方法，将生成一个设备实例(每个蓝牙设备对应一个实例)，该设备的连接状态等数据都将维护在该实例中。同时，设备连接、设备指令下发、ota升级等对应的api也定义在该设备实例中。   
注意：   
1、若当前设备 id 对应的实例已经被创建过，则会销毁原有实例，在此创建新的实例并返回。   
2、当设备的蓝牙连接断开时，其对应的实例也会被销毁。（调用instance.reconnectBlue进行蓝牙重连的除外。）


#### 2.3、 获取已创建的实例

```js
const instance = BleService.instance[device_id]
if(!instance) reutrn false
```
> 也可通过该方式获取已生成的设备实例。

#### 2.4、 设置dpcode与dpid的映射关系   
```js
instance.set("_bleIotData", { _ble_dpCodeMap }) 
```

- 参数说明

  | 字段   | 数据类型 | 说明                |
  | :----- | :------- | :------------------ |
  | _ble_dpCodeMap |  Object  | 蓝牙设备dpCode与 dp_id的映射关系 |

- 参数举例
```js
const _ble_dpCodeMap: {
  [dpcode]: [dpid]
} = {
  unlock_method_create: 1,
  unlock_method_delete: 2
}
```

#### 2.5、 与设备建立连接

```js
instance.connectBlue()
```

> 小程序与设备建立蓝牙连接。   
  当建立连接成功或失败时，会执行下文提到的回调事件。

#### 2.6、 发送数据

```js
instance.sendDp({ dpCode, dpValue })
// or
instance.sendDp([
    { dpCode1, dpValue1 },
    { dpCode2, dpValue2 }
])
```
- 参数说明

  | 字段   | 数据类型 | 说明                |
  | :----- | :------- | :------------------ |
  | dpValue| any | dpcode对应要下发的数据 |
  | dpCode | string  | dpcode |

- 参数举例

```js
instance.sendDp({ dpCode: 'welcome_words', dpValue: 'hello world' })
```
> 小程序向设备发送dp数据。   
  当设备需要上报数据时，会执行下文提到的回调事件。

#### 2.7、注册蓝牙回调事件
```js
instance.onReceivePackage(parseReceiveData => {
  const { type, status, dpState, deviceId } = parseReceiveData;

  if (type === 'connect' && status === 'fail') {
    // 连接失败 或 连接后又断开
  } else if (type === 'connect' && status === 'connected') {
    // 连接成功
    wx.showToast({
      title: '蓝牙连接成功',
      icon: 'success',
      duration: 2000
    })
  } else if (!(deviceId in parseReceiveData)) {
    // 一般为dp上报事件，可在此处处理数据or走业务逻辑
    // 上报的数据会被处理成 dpState 对象，dpState 对象下面有举例
    // todo...
  }
});
```

- 参数说明

  | 字段     | 数据类型    | 说明                                              |
  | :------- | :---------- | :------------------------------------------------ |
  | type     | string      | 状态类型：connect-连接状态,otaStatus-OTA 升级状态 |
  | status   | string      | 状态值               |
  | deviceId | string      | 蓝牙设备 id              |
  | dpState  | Object      | 当前蓝牙设备的功能状态集     |

- 回调参数dpState举例

```js
dpState: {
    [dpcode1]: true,
    [dpcode2]: 100
}
```

#### 2.8、取消监听蓝牙回调事件

```js
instance.offReceivePackage(cb);
```

- 参数说明

| 字段     | 数据类型    | 说明                                              |
  | :------- | :---------- | :------------------------------------------------ |
  | cb     | function      | 注册监听时传入的回调函数 |

#### 2.9、注册蓝牙错误事件

```js
instance.onError(cb);
```
- 参数说明

| 字段     | 数据类型    | 说明                                              |
| :------- | :---------- | :------------------------------------------------ |
| cb     | function      | 回调函数 |

- 回调参数举例

```js
cbData: {
    errCode: 1000,
    errMsg: 'error'
}
```

> 蓝牙交互时出现的异常情况都将在此处进行回调。
  对应取消监听api为 instance.offError(cb)


#### 2.10、ota 升级指令

```js
instance.sendOtaRequestOrder(ota_url, upgrade_version);
```
- 参数说明

  | 字段     | 数据类型    | 说明                                              |
  | :------- | :---------- | :------------------------------------------------ |
  | ota_url     | string      | ota升级文件url地址 |
  | upgrade_version   | string  | ota升级文件版本号 |

#### 2.11、设备解绑

```js
instance.unboundBlue(type);
```

- 参数说明

  | 字段     | 数据类型    | 说明                                              |
  | :------- | :---------- | :------------------------------------------------ |
  | type     | string      | 共有三种解绑类型，分别对应不同的type数值：unbound（默认值） - 与设备正常解绑；reset - 设备重置，该类型除了解绑外，还会删除设备本地历史数据，需慎用；force - 设备异常时，强制解绑 |

### 3、其他
以下列举一些业务也许用得着的api。

### 4、整体使用案例
```js
import BleService from '@tuya-wx/bluetooth-sdk'

BleService.initFunction(request);

//  小程序生命周期钩子
onLoad: async function () {
    // 抽象的蓝牙设备实例
    const instance = BleService.setNewInstance(device_id, home_id);
    // 功能点实例化
    instance.set('_bleIotData', { _ble_dpCodeMap });
    // 蓝牙连接
    await instance.connectBlue()

    // 监听蓝牙通信
    instance.onReceivePackage((parseReceiveData) => {
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
    });
},

handleData() {
    const { dpState } = this.data;
    // todo....
}

```

### 5、错误码列表

  | errCode  | 说明                             |
  | :------- | :--------------------------------|
  | 1001     | 蓝牙连接过程中，调用wx api失败 |
  | 1002     | 未授予地理位置权限（安卓特有） |
  | 1003     | 未搜索到蓝牙设备 |
  | 1004     | 设备信息获取失败 |
  | 1005     | 获取蓝牙services列表失败 |
  | 1006     | 获取characteristics列表失败 |
  | 1007     | write characteristic uuid获取失败 |
  | 1008     | 当前设备具有不支持的蓝牙特性 |
  | 1009     | 获取云端实时时间失败 |
  | 1010     | 蓝牙连接过程中，下发命令失败 |
  | 1011     | 云端随机数获取失败 |
  | 2001     | 蓝牙下发dp数据时，下发命令失败 |
  | 2003     | 蓝牙Dp点上报云端时，调用接口失败 |
  | 2004     | 设备解绑、重置时，下发命令失败 |
  | 2005     | 获取设备本地状态信息时，下发命令失败  |
  | 3001     | 发送ota升级请求时，下发命令失败  |
  | 3002     | 蓝牙拒绝ota升级  |
  | 3003     | 不支持ota升级的蓝牙协议版本  |
  | 3004     | 不支持的ota升级类型  |
  | 3005     | 发送ota升级文件信息时，下发命令失败  |
  | 3006     | 发送ota升级文件偏移请求时，下发命令失败  |
  | 3007     | 分包发送ota升级数据包时，下发命令失败  |
  | 3008     | 发送ota升级停止指令时，下发命令失败  |
