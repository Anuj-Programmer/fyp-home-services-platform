import { MapPin, Calendar, Star, CheckCircle } from "phosphor-react";
import { Link } from "react-router-dom";

const TechnicianCard = ({ pro, onBookClick }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow overflow-hidden border border-gray-100 flex flex-col h-full min-w-0 w-[270px]">
      {/* TOP SECTION - IMAGE AREA */}
      <div className="relative w-full h-48 overflow-hidden bg-gray-200">
        <img
          src={pro.photoUrl || "https://via.placeholder.com/400x300"}
          alt={`${pro.firstName} ${pro.lastName}`}
          className="w-full h-full object-cover"
        />
        
        {/* RATING BADGE - Top Left (always show) */}
        <div className="absolute top-3 left-3 z-10 bg-color-main text-white rounded-lg px-2.5 py-1 flex items-center gap-1 shadow-md">
          <Star size={14} weight="fill" className="text-white" />
          <span className="text-[12px]">{(typeof pro.averageRating === 'number' ? pro.averageRating.toFixed(1) : '0.0')}</span>
        </div>

      </div>

      {/* CONTENT SECTION WITH BLUE ACCENT BAR */}
      <div className="flex flex-1 flex-col">
        {/* Top Content - Specialty & Availability */}
        <div className="px-4 pt-4 pb-2 border-l-4 border-blue-950">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-[12px] font-medium text-blue-600">{pro.serviceType}</p>
            <div className="flex items-center gap-1 bg-gray-100 px-2.5 py-0.5 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-xs font-semibold text-gray-700">Available</span>
            </div>
          </div>

          {/* TECHNICIAN NAME WITH VERIFIED BADGE */}
          <div className="flex items-center gap-2">
            <h3 className="text-[17px] font-bold text-gray-900">
              {pro.firstName} {pro.lastName}
            </h3>
            {pro.isVerifiedTechnician && (
              <CheckCircle size={18} weight="fill" className="text-blue-600 shrink-0" title="Verified Technician" />
            )}
          </div>

          {/* LOCATION & DURATION */}
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <MapPin size={14} weight="fill" className="text-gray-600 shrink-0" />
            <span>{pro.location || "Location not specified"}</span>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="mx-4 my-3 border-t border-gray-200"></div>

        {/* FEES & BUTTON SECTION - HORIZONTAL LAYOUT */}
        <div className="px-4 pb-4 flex flex-row justify-between items-center gap-3">
          {/* CONSULTATION FEES */}
          <div>
            <p className="text-xs text-gray-600 font-medium mb-0.5">Fees</p>
            <p className="text-xl font-bold text-orange-500">${pro.fee || 0}</p>
          </div>

          {/* BOOK NOW BUTTON */}
          <Link
            to={`/booktechnician/${pro._id || pro.id}`}
            className="bg-blue-950 hover:bg-blue-900 text-white font-semibold py-2 px-4 rounded-full transition-colors flex items-center justify-center gap-1.5 shadow-md text-sm whitespace-nowrap shrink-0"
            onClick={onBookClick}
          >
            <Calendar size={14} weight="fill" />
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TechnicianCard;
