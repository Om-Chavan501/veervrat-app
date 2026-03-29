import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export function JoinRedirect() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    navigate(`/register?invite=${code}`, { replace: true })
  }, [code, navigate])

  return null
}
