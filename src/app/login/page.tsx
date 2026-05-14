// /login redireciona para / (onde está a página de login real)
import { redirect } from 'next/navigation'
export default function LoginRedirect() {
  redirect('/')
}
