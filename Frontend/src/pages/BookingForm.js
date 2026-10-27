import moment from 'moment';
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { createBooking, fetchSpaces, createPaymentIntent } from '../api/api'
import './../css/createParking.scss'
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from '../components/CheckoutForm';

const stripePromise = loadStripe('pk_test_51Lx...your_public_key'); // Ideally from env

const BookingForm = () => {
    const { state } = useLocation();
    const user = useSelector((state) => state.user);
    const [space, setSpace] = useState('');

    // Create a form object for storing values
    const [form, setForm] = useState({
        vehicle_company: '',
        vehicle_model: '',
        plate_number: '',
        car_color: '',
        plate_number: '',
        car_color: '',
        mobile_number: '',
        space_id: '',
        startTime: '',
        endTime: '',
    })

    const [clientSecret, setClientSecret] = useState("");
    const [bookingAmount, setBookingAmount] = useState(0);
    const [surgeMessage, setSurgeMessage] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [scanning, setScanning] = useState(false);

    const checkSurge = (start, end, basePrice) => {
        let total = 0;
        let isPeak = false;
        let isWeekend = false;

        let current = moment(start);
        const endTime = moment(end);

        while (current.isBefore(endTime)) {
            let nextHour = moment(current).add(1, 'hour');
            if (nextHour.isAfter(endTime)) nextHour = endTime;

            const hours = moment.duration(nextHour.diff(current)).asHours();
            let hourlyRate = basePrice;

            const day = current.day();
            if (day === 0 || day === 6) {
                hourlyRate *= 1.2;
                isWeekend = true;
            }

            const hour = current.hour();
            if (hour >= 9 && hour < 18) {
                hourlyRate *= 1.5;
                isPeak = true;
            }

            total += hours * hourlyRate;
            current = nextHour;
        }

        let msg = null;
        if (isPeak && isWeekend) msg = "Surge Applied: Weekend (1.2x) & Peak Hours (1.5x)";
        else if (isPeak) msg = "Surge Applied: Peak Hours 9am-6pm (1.5x)";
        else if (isWeekend) msg = "Surge Applied: Weekend Pricing (1.2x)";

        return { total: total.toFixed(2), msg };
    }

    const [isCreated, setIsCreated] = useState(false)
    const [error, setError] = useState()

    // Handles form values upon change
    const handleFormChange = ({ key, value }) => {
        setForm({ ...form, [key]: value })
    }

    const handleCreateBooking = () => {
        setIsCreated(false)
        setError()

        if (!form.startTime || !form.endTime) {
            setError("Please select start and end times");
            return;
        }

        // Combine Space Date with Field Time
        // space.date is ISO or Date object.
        const dateStr = moment(space?.date).format('YYYY-MM-DD'); // "2023-10-25"

        // form.startTime is "14:30" (24h format from input type="time")
        const startDateTime = moment(`${dateStr} ${form.startTime}`, 'YYYY-MM-DD HH:mm').toDate();
        const endDateTime = moment(`${dateStr} ${form.endTime}`, 'YYYY-MM-DD HH:mm').toDate();

        const body = {
            ...form,
            user_id: user?._id,
            startTime: startDateTime,
            endTime: endDateTime
        }
        createBooking({ body, handleCreateBookingSuccess, handleCreateBookingFailure })
    }

    const handleCreateBookingSuccess = (data) => {
        setIsCreated(true)
    }

    const handleCreateBookingFailure = (error) => {
        setError(error)
    }

    const [spaces, setSpaces] = useState()

    useEffect(() => {
        // Space List API sets spaces state using setSpaces passed as callback function
        fetchSpaces({ setSpaces })

        setSpace(state?.space)

        handleFormChange({ key: 'space_id', value: state?.space?._id })
        handleFormChange({ key: 'space_id', value: state?.space?._id })
    }, [state])

    // Calculate Price and Create Payment Intent
    useEffect(() => {
        if (form.startTime && form.endTime && space?.price) {
            const dateStr = moment(space?.date).format('YYYY-MM-DD');
            const start = moment(`${dateStr} ${form.startTime}`, 'YYYY-MM-DD HH:mm');
            const end = moment(`${dateStr} ${form.endTime}`, 'YYYY-MM-DD HH:mm');

            const durationHrs = moment.duration(end.diff(start)).asHours();

            if (durationHrs > 0) {
                const { total, msg } = checkSurge(start, end, space.price);
                setBookingAmount(total);
                setSurgeMessage(msg);
                // Fake Booking: No Stripe Intent needed
            } else {
                setBookingAmount(0);
            }
        }
    }, [form.startTime, form.endTime, space]);

    const handleFakePayment = () => {
        setShowScanner(true);
        setScanning(true);
        setTimeout(() => {
            setScanning(false);
            setShowScanner(false);
            handleCreateBooking();
        }, 3000); // 3 seconds fake scan
    }

    console.log('space ', space);

    return (
        <div className='container py-5'>
            <div className='card create-parking-card p-5'>
                <h3 className='mb-4'>Make booking</h3>
                {isCreated && <div className="alert alert-success" role="alert">
                    Booked successfully!
                </div>}
                {error && <div className="alert alert-danger" role="alert">
                    {error}
                </div>}
                <div className="mb-3">
                    <label htmlFor="vehicle_company" className="form-label">Vehicle company</label>
                    <input type="text" className="form-control" id="vehicle_company" value={form?.vehicle_company} onChange={(e) => handleFormChange({ key: 'vehicle_company', value: e.target.value })} required />
                </div>
                <div className="mb-3">
                    <label htmlFor="vehicle_model" className="form-label">Vehicle model</label>
                    <input type="text" className="form-control" id="vehicle_model" value={form?.vehicle_model} onChange={(e) => handleFormChange({ key: 'vehicle_model', value: e.target.value })} required />
                </div>
                <div className="mb-3">
                    <label htmlFor="plate_number" className="form-label">Plate number</label>
                    <input type="text" className="form-control" id="plate_number" value={form?.plate_number} onChange={(e) => handleFormChange({ key: 'plate_number', value: e.target.value })} required />
                </div>
                <div className="mb-3">
                    <label htmlFor="car_color" className="form-label">Car color</label>
                    <input type="text" className="form-control" id="car_color" value={form?.car_color} onChange={(e) => handleFormChange({ key: 'car_color', value: e.target.value })} required />
                </div>
                <div className="mb-3">
                    <label htmlFor="mobile_number" className="form-label">Mobile Number</label>
                    <input type="tel" className="form-control" id="mobile_number" value={form?.mobile_number} onChange={(e) => handleFormChange({ key: 'mobile_number', value: e.target.value })} required placeholder="+91 99999 99999" />
                </div>
                <div className="mb-3">
                    <label htmlFor="space" className="form-label">Space</label>
                    <select className="form-select" value={form?.space_id} onChange={(e) => handleFormChange({ key: 'space_id', value: e.target.value })} disabled>
                        <option value="">Select</option>
                        {spaces?.map((item) => (
                            <option value={item?._id}>{item?.name}</option>
                        ))}
                    </select>
                </div>
                <div className="mb-3">
                    <label htmlFor="startTime" className="form-label">Start Time</label>
                    <input type="time" className="form-control" id="startTime" value={form?.startTime} onChange={(e) => handleFormChange({ key: 'startTime', value: e.target.value })} required />
                </div>
                <div className="mb-3">
                    <label htmlFor="endTime" className="form-label">End Time</label>
                    <input type="time" className="form-control" id="endTime" value={form?.endTime} onChange={(e) => handleFormChange({ key: 'endTime', value: e.target.value })} required />
                </div>
                <div className="mb-3">
                    <label htmlFor="space" className="form-label">Space details</label>
                    <p><strong>Date: </strong>{moment.utc(space?.date).format('DD-MM-YYYY')}</p>
                    <p><strong>Start time: </strong>{space?.slot_start_time}</p>
                    <p><strong>End time: </strong>{space?.slot_end_time}</p>
                    <p><strong>Price/Hr: </strong>${space?.price}</p>
                    {surgeMessage && <div className="alert alert-warning py-1">{surgeMessage}</div>}
                    <p><strong>Total Amount: </strong>${bookingAmount}</p>
                    <p><strong>Address: </strong>{space?.parking_id?.address}</p>
                    <p><strong>City: </strong>{space?.parking_id?.city}</p>
                </div>

                {bookingAmount > 0 ? (
                    <div className='mt-4'>
                        <h5>Pay & Book</h5>
                        {showScanner ? (
                            <div className="text-center p-3 border rounded bg-light">
                                <h5>Scan QR Code to Pay</h5>
                                {scanning ? (
                                    <>
                                        <div className="spinner-border text-primary" role="status"></div>
                                        <p className="mt-2 text-primary">Processing Payment...</p>
                                    </>
                                ) : (
                                    <p className="text-success fw-bold">Payment Successful!</p>
                                )}
                                <div style={{ width: '150px', height: '150px', background: 'white', margin: '10px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #000' }}>
                                    <i className="bi bi-qr-code" style={{ fontSize: '4rem' }}></i>
                                </div>
                            </div>
                        ) : (
                            <button className="btn btn-success w-100" onClick={handleFakePayment}>
                                Pay ${bookingAmount} & Book
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="alert alert-info mt-4">
                        {form.startTime && form.endTime && moment(form.endTime, 'HH:mm').isSameOrBefore(moment(form.startTime, 'HH:mm'))
                            ? "End time must be strictly after Start time"
                            : "Select Valid Start and End Time to calculate price and pay"}
                    </div>
                )}
            </div>
        </div >
    )
}

export default BookingForm