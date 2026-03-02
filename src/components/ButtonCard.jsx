const ButtonCard = ({
  title,
  description,
  icon,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group w-full text-left rounded-2xl border border-blue-50 bg-gradient-to-br 
                 from-white via-blue-50/40 to-blue-100/40 p-4 sm:p-6 shadow-md transition 
                 duration-300 focus:outline-none focus-visible:ring-2 
                 focus-visible:ring-blue-500 focus-visible:ring-offset-2 
                 focus-visible:ring-offset-blue-50 ${
                   disabled
                     ? "opacity-60 cursor-not-allowed"
                     : "hover:-translate-y-1 hover:shadow-xl"
                 }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {icon && (
          <span
            className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full 
                       bg-blue-600 text-xl text-white shadow-sm 
                       group-hover:bg-blue-700 group-hover:shadow-md transition"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <div>
          <h3 className="text-lg font-semibold text-blue-800 mb-1">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
};

export default ButtonCard;
