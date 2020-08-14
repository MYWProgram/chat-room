$(function () {
  // * io-client
  // * 连接成功会触发服务器端的 connection 事件。
  const socket = io();
  // ? 用户登录。
  const inputName = () => {
    // * 随机分配头像。
    const imgN = Math.floor(Math.random() * 10) + 1;
    if ($('#name').val().trim() !== '')
      // * 触发登录事件。
      socket.emit('login', {
        name: $('#name').val(),
        img: 'image/user' + imgN + '.jpg'
      });
    return false;
  };
  // * 监听键盘回车进行登录。
  $('#name').keyup(ev => {
    if (ev.which == 13) {
      inputName();
    }
  });
  // * 点击确定按钮进行登录。
  $('#nameBtn').click(inputName);
  // * 登录成功，隐藏登录层。
  socket.on('loginSuc', () => {
    $('.name').hide();
  });
  // * 登录错误处理。
  socket.on('loginError', () => {
    alert('用户名已存在，请重新输入！');
    $('#name').val('');
  });
  // * 系统提示消息。
  socket.on('system', user => {
    const data = new Date().toTimeString().substr(0, 8);
    $('#messages').append(
      `<p class='system'><span>${data}</span><br /><span>${user.name}  ${user.status}了聊天室<span></p>`
    );
    // * 滚动条总是在最底部。
    $('#messages').scrollTop($('#messages')[0].scrollHeight);
  });
  // * 定义窗口抖动所需的定时器 id.
  let timer = null;
  // ? 窗口抖动。
  const shake = () => {
    $('.main').addClass('shaking');
    clearTimeout(timer);
    timer = setTimeout(() => {
      $('.main').removeClass('shaking');
    }, 500);
  };
  // * 监听抖动事件进行触发。
  socket.on('shake', user => {
    const data = new Date().toTimeString().substr(0, 8);
    $('#messages').append(
      `<p class='system'><span>${data}</span><br /><span>${user.name}发送了一个窗口抖动</span></p>`
    );
    shake();
    // * 滚动条总是在最底部。
    $('#messages').scrollTop($('#messages')[0].scrollHeight);
  });
  // ? 显示在线人员功能。
  const displayUser = users => {
    // * 每次都要重新渲染。
    $('#users').text('');
    if (!users.length) {
      $('.contacts p').show();
    } else {
      $('.contacts p').hide();
    }
    $('#num').text(users.length);
    for (let i = 0; i < users.length; i++) {
      const $html = `<li>
          <img src="${users[i].img}">
          <span>${users[i].name}</span>
        </li>`;
      $('#users').append($html);
    }
  };
  // * 显示在线人员。
  socket.on('disUser', usersInfo => {
    displayUser(usersInfo);
  });
  // * 定义字体 color ，在发送消息功能中添加字体换色功能。
  let color = '#000000';
  // ? 消息发送。
  const sendMsg = () => {
    if ($('#m').val() == '') {
      alert('请输入内容！');
      return false;
    }
    color = $('#color').val();
    socket.emit('sendMsg', {
      msg: $('#m').val(),
      color: color,
      type: 'text'
    });
    $('#m').val('');
    return false;
  };
  // * 发送消息。
  $('#sub').click(sendMsg);
  $('#m').keyup(ev => {
    if (ev.which == 13) {
      sendMsg();
    }
  });
  // * 接收消息。
  socket.on('receiveMsg', obj => {
    // * 发送为图片。
    if (obj.type == 'img') {
      $('#messages').append(`
          <li class='${obj.side}'>
            <img src="${obj.img}">
            <span>${obj.name}</span>
            <div>
              <p style="padding: 0;">${obj.msg}</p>
            </div>
          </li>
        `);
      $('#messages').scrollTop($('#messages')[0].scrollHeight);
      return;
    }
    // * 提取文字中的表情加以渲染。
    let msg = obj.msg,
      content = '';
    // * 表情符号都是以 '[' 开头的。
    while (msg.indexOf('[') > -1) {
      const start = msg.indexOf('['),
        end = msg.indexOf(']');
      content += '<span>' + msg.substr(0, start) + '</span>';
      content += '<img src="image/emoji/emoji%20(' + msg.substr(start + 6, end - start - 6) + ').png">';
      msg = msg.substr(end + 1, msg.length);
    }
    content += '<span>' + msg + '</span>';
    $('#messages').append(`
        <li class='${obj.side}'>
          <img src="${obj.img}">
          <span>${obj.name}</span>
          <div>
            <p style="color: ${obj.color};">${content}</p>
          </div>
        </li>
      `);
    // * 滚动条总是在最底部。
    $('#messages').scrollTop($('#messages')[0].scrollHeight);
  });
  // * 清空历史消息。
  $('#clear').click(() => {
    $('#messages').text('');
    socket.emit('disconnect');
  });
  // ? 渲染表情选择面板。
  const init = () => {
    for (let i = 0; i < 141; i++) {
      $('.emoji').append('<li id=' + i + '><img src="image/emoji/emoji (' + (i + 1) + ').png"></li>');
    }
  };
  init();
  // * 显示表情。
  $('#smile').click(() => {
    $('.selectBox').css('display', 'block');
  });
  $('#smile').dblclick(ev => {
    $('.selectBox').css('display', 'none');
  });
  $('#m').click(() => {
    $('.selectBox').css('display', 'none');
  });
  // * 用户点击发送表情。
  $('.emoji li img').click(ev => {
    ev = ev || window.event;
    let src = ev.target.src,
      emoji = src.replace(/\D*/g, '').substr(6, 8),
      old = $('#m').val();
    $('#m').val(old + '[emoji' + emoji + ']');
    $('.selectBox').css('display', 'none');
  });
  // * 用户发送抖动。
  $('.edit #shake').click(() => {
    socket.emit('shake');
  });
  // * 用户发送图片。
  $('#file').change(function () {
    // * 上传单张图片。
    const file = this.files[0],
      reader = new FileReader();
    // * 文件读取出错的时候触发。
    reader.onerror = () => {
      console.log('读取文件失败，请重试！');
    };
    // * 读取成功后。
    reader.onload = () => {
      // * 读取结果。
      const src = reader.result,
        img = '<img class="sendImg" src="' + src + '">';
      // * 发送。
      socket.emit('sendMsg', {
        msg: img,
        color: color,
        type: 'img'
      });
    };
    // * 读取为 64 位。
    reader.readAsDataURL(file);
  });
});
