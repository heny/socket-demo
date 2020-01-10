import React, { createRef, useCallback, useEffect, useRef, useState } from 'react'
import { useMappedState, useDispatch } from 'redux-react-hook'
import SendOprtions from './components/oprationBtn/oprationBtn'
import MessageList from './components/messageList/messageList'
import SendImage from './components/sendImage/sendImage'
import Header from './components/header/header'
import './App.scss'
import { getMessageList, addMessage, uploadFile } from './api/message'
import {
  setShowLoading as setshowloading,
  setInfo as setinfo,
  setStatus as setstatus
} from './store/actions'

export default ({ socket }) => {
  const [msg, setMsg] = useState('')
  const [list, setList] = useState([])
  const [isUploadServer] = useState(true) // 是否保存到数据库
  const [key, setKey] = useState('enter')
  const [showOther, setShowOther] = useState(false) // 显示 更多按钮
  const fileIptRef = createRef(null) // 获取子组件方法
  const inputEl = useRef(null) // 绑定输入框el
  const timerId = useRef(null)
  const [isSelectFile, setIsSelectFile] = useState(true) // 是否可以选择文件

  const mapState = useCallback(state => ({
    info: state.toast.info,
    showLoading: state.toast.showLoading
  }), [])
  const { showLoading, info } = useMappedState(mapState)
  const dispatch = useDispatch()
  const setShowLoading = useCallback((flag) => {
    setshowloading(flag)(dispatch)
  }, [dispatch])
  const setInfo = useCallback(message => {
    setinfo(message)(dispatch)
  }, [dispatch])
  const setStatus = useCallback(status => {
    setstatus(status)(dispatch)
  }, [dispatch])

  const startToast = useCallback((info, status = 'loading', isPermanent = true, time = 1500) => {
    setShowLoading(true)
    setInfo(info)
    setStatus(status)
    if (!isPermanent) {
      setTimeout(() => {
        setShowLoading(false)
      }, time)
    }
  }, [setInfo, setStatus, setShowLoading])

  // 发送消息函数
  const sendMessage = useCallback((message, size) => {
    socket.emit('message', { message })
    // 判断是否需要保存数据库, 转换的base64超过100k将无法存入数据库
    if (isUploadServer && (!size || size < 1024 * 100)) {
      console.log(message, 'message')
      addMessage({ message })
    }
  }, [isUploadServer, socket])

  // 请求数据
  const fetchList = React.useCallback(async _ => {
    // 判断缓存是否有, 即使有也需要存文件
    startToast('Loading...', 'loading')
    // setShowLoading(true)
    // 请求接口, 重新存缓存
    getMessageList().then(res => {
      if (res.length) {
        setShowLoading(false)
      } else {
        setTimeout(() => {
          setShowLoading(false)
        }, 1500)
      }
      // 将请求到的数据放进list里面
      setList(res)
    }).catch(() => {
      setShowLoading(false)
    })
  }, [setShowLoading, startToast])

  // enter发送消息
  const send = useCallback(async _ => {
    if (!msg) return
    sendMessage(msg)
    setMsg('')
    inputEl.current.value = ''
  }, [msg, sendMessage])

  // 处理文件上传
  const upload = useCallback(async file => {
    let formData = new FormData()
    formData.append('file', file)
    let res = await uploadFile(formData)
    if (file.size > 1024 * 1024) {
      startToast('上传成功,正在推送消息...')
      // setShowLoading(true)
      // setInfo('上传成功,正在推送消息...')
      timerId.current = setTimeout(() => {
        setInfo('文件过大, 请耐心等待...')
        setTimeout(() => {
          setInfo('加载超时, 正在重新加载页面...')
          setTimeout(() => {
            window.location.reload()
          }, 1500)
        }, 30000)
      }, 3000)
    }
    if (res) {
      setIsSelectFile(false)
      socket.emit('message', res)
    }
  }, [socket, startToast, setInfo, setIsSelectFile])


  // 拖拽发送图片
  const dragUpload = useCallback(() => {
    // 触发ondrog事件
    document.ondragover = e => e.preventDefault()
    document.ondrop = e => e.preventDefault()
    document.querySelector('.msg-list').ondrop = e => {
      let { files: [file] } = e.dataTransfer
      file && upload(file)
    }
  }, [upload])


  useEffect(() => {
    dragUpload()
    fetchList()
    // 创建接收事件
    socket.on('jieshou', message => {
      // 判断是否是定时器在执行
      timerId.current && clearTimeout(timerId.current)
      setShowLoading(false)
      setList(state => {
        let state2 = JSON.parse(JSON.stringify(state))
        state2.unshift(message)
        setIsSelectFile(true)
        return state2
      })
    })
  }, [fetchList, setIsSelectFile, setShowLoading, dragUpload, socket])

  const handleEnter = useCallback(e => {
    if (e.keyCode === 13) {
      send()
      inputEl.current.value = ''
    }
  }, [send])

  // 判断发送事件
  const handlerSend = useCallback(e => {
    if (key === 'enter') {
      if (e.keyCode === 13) {
        // 阻止默认的回车按钮
        e.preventDefault()
        send()
        inputEl.current.value = ''
      }
    } else {
      if (e.keyCode === 17) {
        inputEl.current.addEventListener('keydown', handleEnter)
        // 抬起清除事件
        inputEl.current.addEventListener('keyup', e => {
          if (e.keyCode === 17) {
            inputEl.current.removeEventListener('keydown', handleEnter)
          }
        })
      }
    }
  }, [handleEnter, key, send])

  // 粘贴发送消息
  const pasteHandler = useCallback(e => {
    debugger
    e.persist()
    let { files: [file] } = e.clipboardData
    file && upload(file)
  }, [upload])

  return (
    <div className='App'>
      <Header />
      <MessageList {...{ list, setList, showLoading, setShowLoading, setStatus, info, startToast }} />
      <div className='footer'>
        <div className="input-group">
          <textarea
            className='msg-ipt'
            onChange={e => { setMsg(e.target.value) }}
            value={msg}
            onKeyDown={e => handlerSend(e)}
            onPaste={pasteHandler}
            placeholder='可在此粘贴图片发送'
            ref={inputEl}
            type='text'
          />
          <div className="btn-group">
            <button className='btn-group__item send'
              onClick={send}
              disabled={!msg}
            >发送</button>
            <button onClick={() => setShowOther(true)} className='btn-group__item other'>
              其他
            </button>
          </div>
        </div>
        <SendImage ref={fileIptRef}
          {...{ setShowLoading, startToast, upload, isSelectFile, setIsSelectFile }}
        />
        {showOther && (
          <div className="shadow-box" onClick={() => setShowOther(false)}>
            <div className='other-options'>
              <div className="other-options__title">其他操作</div>
              <ul>
                <li>
                  <SendOprtions setKey={setKey} />
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
