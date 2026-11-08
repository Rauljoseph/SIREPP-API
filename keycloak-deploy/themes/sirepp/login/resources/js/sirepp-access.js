document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('kc-totp-settings-form')
  const instructions = document.getElementById('kc-totp-settings')
  if (!form || !instructions) return

  const explanations = instructions.lastElementChild?.querySelectorAll('p')
  const fields = [
    { id: 'totp', description: explanations?.[0] },
    { id: 'userLabel', description: explanations?.[1] },
  ]

  for (const { id, description } of fields) {
    const input = form.querySelector('#' + id)
    const group = input?.closest('.pf-v5-c-form__group') ?? input?.parentElement?.parentElement
    const label = group?.querySelector('label')
    if (!label || !description?.textContent.trim()) continue
    label.htmlFor = id

    const help = document.createElement('span')
    help.className = 'sirepp-help'

    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = '?'
    button.setAttribute('aria-label', label.textContent.trim().replace(/\s*\*\s*$/, ''))

    const tip = document.createElement('span')
    tip.id = 'sirepp-help-' + id
    tip.setAttribute('role', 'tooltip')
    tip.textContent = description.textContent.trim()
    tip.hidden = true
    button.setAttribute('aria-describedby', tip.id)

    button.addEventListener('mouseenter', () => { tip.hidden = false })
    button.addEventListener('mouseleave', () => {
      if (document.activeElement !== button) tip.hidden = true
    })
    button.addEventListener('focus', () => { tip.hidden = false })
    button.addEventListener('blur', () => { tip.hidden = true })
    button.addEventListener('click', () => { tip.hidden = false })
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') tip.hidden = true
    })

    help.append(button, tip)
    label.after(help)
    description.remove()
  }

  if (!instructions.lastElementChild?.textContent.trim()) {
    instructions.lastElementChild?.remove()
  }

  if (form.parentElement === instructions.parentElement) {
    const layout = document.createElement('div')
    layout.className = 'sirepp-enrollment'
    instructions.before(layout)
    layout.append(instructions, form)
  }
})

document.addEventListener('DOMContentLoaded', () => {
  const marker = 'sirepp-password-reset-in-progress'
  const invitationMarker = 'sirepp-invitation-in-progress'
  const otp = document.getElementById('kc-otp-login-form')
  const isResetPath = window.location.pathname.endsWith('/login-actions/reset-credentials')

  if (otp && isResetPath) {
    otp.addEventListener('submit', () => {
      try { sessionStorage.setItem(marker, String(Date.now())) } catch {}
    })
  }

  const title = document.getElementById('kc-page-title')
  const message = document.querySelector('#kc-info-message .instruction')
  const returnLink = document.querySelector('#kc-info-message a[href]')
  if (!title || !message || !returnLink) return

  if (title.textContent.trim() === 'Configura tu acceso a SIREPP') {
    document.documentElement.classList.add('sirepp-invitation')
    message.textContent = 'Sigue los pasos para activar tu cuenta. Si ya completaste alguno, continuarás donde quedaste.'
    returnLink.textContent = 'Continuar con la activación'
    returnLink.classList.add('pf-v5-c-button', 'pf-m-primary')
    returnLink.addEventListener('click', () => {
      try { sessionStorage.setItem(invitationMarker, String(Date.now())) } catch {}
    })
    return
  }

  if (title.textContent.trim() !== 'Cuenta actualizada') return

  const execution = new URLSearchParams(window.location.search).get('execution')
  let recentReset = false
  let recentInvitation = false
  try {
    const started = Number(sessionStorage.getItem(marker))
    recentReset = started > 0 && Date.now() - started < 600_000
    const invited = Number(sessionStorage.getItem(invitationMarker))
    recentInvitation = invited > 0 && Date.now() - invited < 3_600_000
  } catch {}
  if (!recentInvitation && !recentReset && execution !== 'UPDATE_PASSWORD') return

  title.textContent = recentInvitation ? 'Tu cuenta está lista' : 'Contraseña actualizada'
  message.textContent = 'Ya puedes iniciar sesión en SIREPP con tu nueva contraseña.'
  if (recentInvitation) {
    document.documentElement.classList.add('sirepp-invitation-complete')
    message.classList.add('sirepp-password-success')
    message.setAttribute('role', 'status')
  }
  returnLink.textContent = recentInvitation ? 'Iniciar sesión en SIREPP' : 'Volver al inicio de sesión'
  returnLink.classList.add('pf-v5-c-button', 'pf-m-primary')
  try {
    sessionStorage.removeItem(marker)
    sessionStorage.removeItem(invitationMarker)
  } catch {}
})
