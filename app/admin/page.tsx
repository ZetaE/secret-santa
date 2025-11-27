import { redirect } from 'next/navigation';

export default function AdminRedirect() {
  // Questa pagina reindirizza alla pagina admin corretta
  redirect(`/admin/${process.env.ADMIN_SECRET_PATH}`);
}
