import { Customer } from "@/types/customer";

export const fetchDataProfile = async (setUserDataProfile: (Customer: Customer) => void): Promise<void> => {
    if (typeof window === "undefined") return; // ป้องกัน SSR
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("ไม่พบ token");
      return;
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/customer`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.message || "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้");
      }
      const data = await response.json();
      setUserDataProfile(data.data.customer);
      localStorage.setItem("profileUser", JSON.stringify(data.data.customer));
  
      // ตั้งเวลาหมดอายุ cache 1 วัน (24 ชั่วโมง)
      const expireAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hr = 86400000 ms
      localStorage.setItem("profileUserExpire", expireAt.toString());
  
      console.log("ข้อมูลผู้ใช้:", data);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:", error);
    }
  };
  