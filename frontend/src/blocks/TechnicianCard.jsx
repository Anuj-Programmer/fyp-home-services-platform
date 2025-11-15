import { CheckCircle, Star, Clock } from "phosphor-react";

const TechnicianCard = ({ pro }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition p-4 flex flex-col">
      <img
        src={pro.image}
        alt={pro.name}
        className="h-48 w-full object-cover rounded-xl mb-4"
      />
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{pro.name}</h3>
        {pro.verified && (
          <CheckCircle size={22} weight="fill" className="text-[#14B8A6]" />
        )}
      </div>
      <p className="text-gray-500">{pro.service}</p>
      <div className="flex items-center text-yellow-500 mt-2">
        <Star size={20} weight="fill" />
        <span className="ml-1 text-gray-700">{pro.rating}</span>
      </div>
      <div className="flex justify-between items-center mt-3">
        <span className="txt-color-primary font-semibold">{pro.price}</span>
        <div className="flex items-center text-gray-500 text-sm">
          <Clock size={18} className="mr-1" /> Available
        </div>
      </div>
    </div>
  );
};

export default TechnicianCard;
