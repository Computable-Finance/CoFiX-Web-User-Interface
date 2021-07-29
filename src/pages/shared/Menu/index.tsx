import './styles'

import { Trans } from '@lingui/macro'
import { FC } from 'react'
import Popup from 'reactjs-popup'
import { Community, Document, Ellipsis, Github, LangCN, LangEN, Switch, Whitepaper } from 'src/components/Icon'
import { dynamicActivate } from 'src/libs/i18n/config'

type Props = {
  onSelect?: (menu: string) => void
}

const Menu: FC<Props> = (props) => {
  const menus = [
    {
      id: 'white-paper',
      link: 'https://cofix.tech/doc/CoFiX_White_Paper.pdf',
      icon: <Whitepaper />,
      content: <Trans>WhitePaper</Trans>,
    },
    {
      id: 'document',
      link: 'https://docs.cofix.io/',
      icon: <Document />,
      content: <Trans>Document</Trans>,
    },
    {
      id: 'github',
      link: 'https://github.com/Computable-Finance',
      icon: <Github />,
      content: <Trans>Github</Trans>,
    },
    {
      id: 'community',
      link: 'https://t.me/CofiXProtocol',
      icon: <Community />,
      content: <Trans>Community</Trans>,
    },
    {
      id: 'switch-to-v2.0',
      link: 'https://v2.cofix.tech',
      icon: <Switch />,
      content: <Trans>Switch to v2.0</Trans>,
    },
  ]

  const langs = [
    {
      id: 'lang-en-us',
      locale: 'en-US',
      icon: <LangEN />,
      content: 'English',
    },
    {
      id: 'lang-zh-cn',
      locale: 'zh-CN',
      icon: <LangCN />,
      content: '中文',
    },
  ]

  const select = (menu: string) => {
    return () => {
      if (props.onSelect) {
        props.onSelect(menu)
      }
    }
  }

  const switchLang = (lang: { id: string; locale: string }) => {
    return () => {
      dynamicActivate(lang.locale)
      if (props.onSelect) {
        props.onSelect(lang.id)
      }
    }
  }

  const classPrefix = 'cofi-menu'

  return (
    <menu className={`${classPrefix}`}>
      <ul>
        {menus.map((m) => (
          <li key={m.id} onClick={select(m.id)}>
            <a href={m.link} target="_blank" rel="noreferrer">
              {m.icon}
              <span>{m.content}</span>
            </a>
          </li>
        ))}
      </ul>

      <div className="divider"></div>

      <ul className={`${classPrefix}-lang`}>
        {langs.map((l) => (
          <li key={l.id} onClick={switchLang(l)}>
            <a>
              {l.icon}
              <span>{l.content}</span>
            </a>
          </li>
        ))}
      </ul>
    </menu>
  )
}

export const MenuButton: FC<
  Props & {
    modal?: boolean
  }
> = (props) => {
  return (
    <Popup
      modal={props.modal}
      trigger={
        <button className="cofi-menu-button">
          <Ellipsis />
        </button>
      }
    >
      <Menu {...props} />
    </Popup>
  )
}
