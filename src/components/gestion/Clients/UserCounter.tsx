 
import Image from "next/image"

interface UserCounterProps {
  count: number
}

export function UserCounter({ count = 0 }: UserCounterProps) {
  return (
    <div className="w-full max-w-xs rounded-3xl relative border border-gray-200 bg-white p-6 shadow-sm">
        <div className="rounded-b-xl w-52 h-7 absolute top-0 left-5  bg-[#007AFF] px-2   text-white">

            <span className="text-xs ml-4  font-normal ">NOMBRE D&apos;UTILISATEURS APP</span>
          </div>
      <div className="flex items-center justify-between mt-6">
         
          
          <h2 className="text-xl font-medium text-[#9796A1]">{count} clients</h2>
      
        <div className="text-[#F17922]">
          <Image src='/icons/client.png' alt='client' width={30} height={30} />
        </div>
      </div>
    </div>
  )
}

