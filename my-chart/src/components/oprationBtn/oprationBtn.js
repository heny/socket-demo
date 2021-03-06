import React, { useCallback } from 'react'
import { useDispatch, useMappedState } from 'redux-react-hook'
import { setCompress } from '../../store/actions'
import { CSSTransition } from 'react-transition-group'
import './oprationBtn.scss'

export default function (props) {
  let { setKey, myKey } = props
  const dispatch = useDispatch()
  const mapState = useCallback(state => ({
    isCompressImg: state.oprationBtn.isCompressImg,
    isNoticeOnline: state.oprationBtn.isNoticeOnline
  }), [])
  const { isCompressImg } = useMappedState(mapState)
  return (
    <ul className='opration-btn-group'>
      <li className='send-options'>
        <span className='span'>发送消息按键：</span>
        <input type="radio" hidden name="send-options" onChange={() => setKey('enter')} className='item' defaultChecked={myKey === 'enter'} id="enter-radio" />
        <label htmlFor="enter-radio">
          <span>enter</span>
        </label>

        <input type="radio" hidden name="send-options" onChange={() => setKey('ctrl-enter')} className='item' defaultChecked={myKey === 'ctrl-enter'} id="ctrl_enter-radio" />
        <label htmlFor="ctrl_enter-radio" >
          <span>ctrl+enter</span>
        </label>
      </li>
      <li>
        <span className="span">是否压缩图片：</span>
        <input type="radio" onChange={() => dispatch(setCompress(true))} defaultChecked={isCompressImg} hidden name='compress-img' id='yes' />
        <label htmlFor="yes">
          <span>是</span>
        </label>
        <input type="radio" onChange={() => dispatch(setCompress(false))} defaultChecked={!isCompressImg} hidden name='compress-img' id='no' />
        <label htmlFor="no" style={{ marginRight: '30px' }}>
          <span>否</span>
        </label>
        <CSSTransition
          appear={true}
          unmountOnExit
          className='fade'
          timeout={2000}
          in={!isCompressImg}
        >
          <div>
            <span className='specify'>图片不压缩上传将很慢</span>
          </div>
        </CSSTransition>
      </li>
    </ul>
  )
}
