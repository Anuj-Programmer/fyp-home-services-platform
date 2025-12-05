import axios from "axios";

export async function uploadToCloudinary(file){
    const res = await axios.post("https://api.cloudinary.com/v1_1/dxbp2wxun/image/upload", {file: file, upload_preset: "odas_default"},{

        headers: {
            "Content-Type": "multipart/form-data"
        }
    })
    return res.data;
}