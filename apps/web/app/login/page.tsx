import { LoginButtons } from "../components/LoginButtons"

export default function LoginPage() {
  return (
    <main className="dd-stack">
      <div className="dd-page-head">
        <div>
          <h1 className="dd-page-title">Log in</h1>
          <p className="dd-page-sub">
            Pick the platform your bot runs on. You will see the spaces you manage there.
          </p>
        </div>
      </div>
      <LoginButtons />
    </main>
  )
}
