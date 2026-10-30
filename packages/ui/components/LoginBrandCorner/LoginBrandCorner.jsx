'use client'

import Image from 'next/image'

/** Full BikeWo logo — top-left on login branding panels. */
export function LoginBrandCorner({
  brandIconPath,
  brandLogoPath,
  brandName = 'BikeWo',
  className = '',
}) {
  const logoSrc = brandLogoPath || brandIconPath
  if (!logoSrc) return null

  return (
    <div className={`absolute top-8 left-8 z-10 ${className}`.trim()}>
      <Image
        src={logoSrc}
        alt={brandName}
        width={200}
        height={80}
        className="h-12 w-auto max-w-[220px] object-contain object-left"
        priority
      />
    </div>
  )
}

/** Product name + creator line — text only, no icon. */
export function LoginProductCredit({
  productName,
  creatorLine,
  className = '',
  tone = 'on-orange',
}) {
  const onOrange = tone === 'on-orange'

  return (
    <div className={`mb-8 ${className}`.trim()}>
      <p
        className={`font-bold leading-tight ${
          onOrange ? 'text-white text-lg' : 'text-brand-foreground text-base'
        }`}
      >
        {productName}
      </p>
      {creatorLine ? (
        <p className={`text-xs mt-0.5 ${onOrange ? 'text-white/70' : 'text-gray-500'}`}>
          {creatorLine}
        </p>
      ) : null}
    </div>
  )
}

/** Product name + company line — workspace sidebars. */
export function SidebarProductBranding({
  productName,
  companyName = 'BikeWo',
  className = '',
}) {
  return (
    <div className={`min-w-0 ${className}`.trim()}>
      <span className="block font-bold text-xl tracking-tight leading-tight text-brand-indigo">
        {productName}
      </span>
      <span className="block text-xs font-medium text-brand-slate tracking-tight mt-0.5">
        {companyName}
      </span>
    </div>
  )
}

/** Mobile login form column — full BikeWo logo + product / company names. */
export function LoginMobileBrandHeader({
  brandIconPath,
  brandLogoPath,
  logoPath,
  productName,
  creatorLine = 'BikeWo',
}) {
  const logoSrc = brandLogoPath || logoPath || brandIconPath

  return (
    <div className="mb-8 lg:hidden">
      {logoSrc ? (
        <div className="mb-4">
          <Image
            src={logoSrc}
            alt="BikeWo"
            width={180}
            height={72}
            className="h-10 w-auto max-w-[200px] object-contain object-left"
            priority
          />
        </div>
      ) : null}
      {productName ? (
        <SidebarProductBranding productName={productName} companyName={creatorLine} />
      ) : null}
    </div>
  )
}
