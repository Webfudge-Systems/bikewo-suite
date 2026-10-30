'use client'

import { WorkspaceProfileView } from '@webfudge/ui'
import AccountsPageHeader from '../../components/AccountsPageHeader'

export default function ProfilePage() {
  return <WorkspaceProfileView PageHeader={AccountsPageHeader} />
}
