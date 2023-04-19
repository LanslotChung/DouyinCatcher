//向抖音注入js
var script = document.createElement("script");
script.src = chrome.runtime.getURL("js/hook.js");
document.documentElement.appendChild(script);
var isSend = false;
var isDebug = false;
var outsideWebsocket = null;
chrome.storage.local.get(["douyin_server", "douyin_debug", "douyin_send"]).then((result) => {
  isSend = result.douyin_send;
  isDebug = result.douyin_debug;
  if (result.douyin_server) {
    if (isSend) {
      //创建可重连WebSocket
      outsideWebsocket = new ReconnectingWebSocket(result.douyin_server);
      outsideWebsocket.debug = true;
      outsideWebsocket.timeoutInterval = 1000;
    }
  }
});

//监听来自注入JS的消息
window.addEventListener("message", function (event) {
  if (event.data.message == "Douyin") {
    let e = event.data;
    const PushFrame = proto.PushFrame.deserializeBinary(e.data);
    //判断Payload是否经过GZIP压缩，如果是则解压Payload，否则直接获取Payload_asU8
    const Response = (a = proto.Response.deserializeBinary(
      (function (e) {
        for (const t of Object.values(e.getHeadersList()))
          if ("compress_type" === t.getKey() && "gzip" === t.getValue())
            return true;
        return false;
      })(PushFrame)
        ? pako.inflate(PushFrame.getPayload()) //解压
        : o.getPayload_asU8()
    ));
    for (let message of Response.getMessagesList()) {
      const method = message.getMethod();
      const payload = message.getPayload_asU8();
      let msg = null;
      switch (method) {
        case "WebcastChatMessage":
          //弹幕聊天消息
          const chatMessage = proto.ChatMessage.deserializeBinary(payload);
          msg = {
            method: method,
            userid: chatMessage.getUser().getId() + '',
            nickname: chatMessage.getUser().getNickname(),
            gender: chatMessage.getUser().getGender(),
            avatar: chatMessage.getUser().getAvatarthumb().getUrlsList()[0],
            chat: chatMessage.getContent(),
          };
          break;
        case "WebcastGiftMessage":
          //礼物消息
          const giftMessage = proto.GiftMessage.deserializeBinary(payload);
          msg = {
            method: method,
            userid: giftMessage.getUser().getId() + '',
            nickname: giftMessage.getUser().getNickname(),
            gender: giftMessage.getUser().getGender(),
            avatar: giftMessage.getUser().getAvatarthumb().getUrlsList()[0],
            giftid: giftMessage.getGift().getId(),
            giftname: giftMessage.getGift().getName(),
            giftimage: giftMessage.getGift().getImage().getUrlsList()[0],
            giftcount: giftMessage.getRepeatcount(),
          };
          break;
        case "WebcastLikeMessage":
          //点赞消息
          const likeMessage = proto.LikeMessage.deserializeBinary(payload);
          msg = {
            method: method,
            userid: likeMessage.getUser().getId() + '',
            nickname: likeMessage.getUser().getNickname(),
            gender: likeMessage.getUser().getGender(),
            avatar: likeMessage.getUser().getAvatarthumb().getUrlsList()[0],
            likecount: likeMessage.getCount(),
            liketotal: likeMessage.getTotal(),
          };
          break;
        case "WebcastMemberMessage":
          //观众来了消息
          const memberMessage = proto.MemberMessage.deserializeBinary(payload);
          msg = {
            method: method,
            userid: memberMessage.getUser().getId() + '',
            nickname: memberMessage.getUser().getNickname(),
            gender: memberMessage.getUser().getGender(),
            avatar: memberMessage.getUser().getAvatarthumb().getUrlsList()[0],
            membercount: memberMessage.getMembercount(),
            rankscore: memberMessage.getRankscore(),
          };
          break;
        case "WebcastSocialMessage":
          //关注消息
          const socialMessage = proto.SocialMessage.deserializeBinary(payload);
          msg = {
            method: method,
            userid: socialMessage.getUser().getId() + '',
            nickname: socialMessage.getUser().getNickname(),
            gender: socialMessage.getUser().getGender(),
            avatar: socialMessage.getUser().getAvatarthumb().getUrlsList()[0],
            followcount: socialMessage.getFollowcount(),
          };
          break;
        case "WebcastFansclubMessage":
          //粉丝团消息
          const fansclubMessage =
            proto.FansclubMessage.deserializeBinary(payload);
          msg = {
            method: method,
            userid: fansclubMessage.getUser().getId() + '',
            nickname: fansclubMessage.getUser().getNickname(),
            gender: fansclubMessage.getUser().getGender(),
            avatar: fansclubMessage.getUser().getAvatarthumb().getUrlsList()[0],
            fansclubmessage: fansclubMessage.getContent(),
          };
          break;
      }
      isSend && msg &&
        outsideWebsocket &&
        outsideWebsocket.readyState === 1 &&
        outsideWebsocket.send(JSON.stringify(msg));
      isDebug && msg && console.log(JSON.stringify(msg));
    }
  }
});