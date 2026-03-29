import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Share2, Copy, X, Languages } from 'lucide-react'
import { invitesApi } from '../../api/invites'
import { useAuthStore } from '../../store/authStore'
import { useLanguage } from '../../contexts/LanguageContext'
import { Button } from '../ui/Button'
import type { Lang } from '../../i18n/translations'

interface InviteSheetProps {
  open: boolean
  onClose: () => void
}

export function InviteSheet({ open, onClose }: InviteSheetProps) {
  const { user } = useAuthStore()
  const { t } = useLanguage()
  const [msgLang, setMsgLang] = useState<Lang>('en')

  const { data: invite } = useQuery({
    queryKey: ['invite-mine'],
    queryFn: invitesApi.getMine,
    enabled: open,
  })

  if (!open) return null

  const inviteUrl = invite ? `${window.location.origin}/join/${invite.code}` : ''
  const firstName = user?.name?.split(' ')[0] ?? user?.name ?? ''

  const message =
    msgLang === 'mr'
      ? t('invite.messageMR').replace('{name}', firstName).replace('{url}', inviteUrl)
      : t('invite.messageEN').replace('{name}', firstName).replace('{url}', inviteUrl)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: message, url: inviteUrl })
      } catch {
        // user cancelled share — not an error
      }
    } else {
      handleCopy()
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl)
    toast.success(t('invite.copied'))
  }

  const canNativeShare = !!navigator.share

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-stone-900 rounded-t-2xl shadow-xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-warm-200 dark:bg-stone-700" />
        </div>

        <div className="px-5 pb-8 pt-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-stone-800 dark:text-stone-100">
              {t('invite.sheetTitle')}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-warm-100 dark:hover:bg-stone-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Message preview */}
          <div className="rounded-xl border border-warm-200 dark:border-stone-700 bg-warm-50 dark:bg-stone-800 p-4 mb-4">
            <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
              {invite ? message : '...'}
            </p>
          </div>

          {/* Language toggle for message */}
          <div className="flex items-center gap-2 mb-4">
            <Languages size={14} className="text-stone-400" />
            <span className="text-xs text-stone-400">{t('invite.messageLangToggle')}</span>
            <div className="flex gap-1 ml-auto">
              {(['en', 'mr'] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setMsgLang(l)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    msgLang === l
                      ? 'bg-sage-500 text-white'
                      : 'bg-warm-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-warm-200 dark:hover:bg-stone-600'
                  }`}
                >
                  {l === 'en' ? 'English' : 'मराठी'}
                </button>
              ))}
            </div>
          </div>

          {/* Uses count */}
          {invite && invite.uses_count > 0 && (
            <p className="text-xs text-stone-400 dark:text-stone-500 text-center mb-4">
              {t('invite.joinedCount').replace('{count}', String(invite.uses_count))}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {canNativeShare ? (
              <Button className="flex-1" onClick={handleShare} disabled={!invite}>
                <Share2 size={15} /> {t('invite.shareButton')}
              </Button>
            ) : (
              <Button className="flex-1" onClick={handleCopy} disabled={!invite}>
                <Copy size={15} /> {t('invite.copyButton')}
              </Button>
            )}
            {canNativeShare && (
              <button
                onClick={handleCopy}
                disabled={!invite}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-stone-500 dark:text-stone-400 bg-warm-100 dark:bg-stone-800 hover:bg-warm-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
              >
                <Copy size={14} /> {t('invite.copyButton')}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
