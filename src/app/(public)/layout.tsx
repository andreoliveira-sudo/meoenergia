import Image from 'next/image'
import logoImg from '../../../public/logo.png'

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <div className="mb-8">
                <Image
                    src={logoImg}
                    alt="MEO Energia"
                    width={180}
                    height={60}
                    priority
                    className="h-auto w-auto"
                />
            </div>
            {children}
        </div>
    )
}
