import { useSelector } from 'react-redux';
import getAvater from 'gravatar-url';

export default function ChatHead({ message }) {
    const { user } = useSelector((state) => state.auth);
    const { email } = user || {};
    const { sender, receiver } = message;
    const partnerEmail = sender.email === email ? receiver.email : sender.email;
    const partnerName = sender.email === email ? receiver.name : sender.name;
    const partnerAvater = getAvater(partnerEmail, { size: 80 });

    return (
        <div className='relative flex items-center p-3 border-b border-gray-300'>
            <img
                className='object-cover w-10 h-10 rounded-full'
                src={partnerAvater}
                alt={partnerName}
            />
            <span className='block ml-2 font-bold text-gray-600'>{partnerName}</span>
        </div>
    );
}
