const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema(
  {
    customer_name: String,
    display_name: String,
    is_primary_associated: Boolean,
    is_backup_associated: Boolean,
    customer_id: String,
    contact_id: String,
    currency_code: String,
    currency_symbol: String,
    status: String,
    company_name: String,
    unused_credits: Number,
    outstanding_receivable_amount: Number,
    unused_credits_receivable_amount_bcy: Number,
    outstanding_receivable_amount_bcy: Number,
    outstanding: Number,
    first_name: String,
    last_name: String,
    email: String,
    phone: String,
    mobile: String,
    website: String,
    is_gapps_customer: Boolean,
    created_time: Date,
    updated_time: Date,
    is_portal_invitation_accepted: Boolean,
    cf_type_of_house: String,
    cf_has_an_active_softener: String,
    cf_current_water_hardness_ppm: String,
    cf_location_of_installation: String,
    cf_pipe_diameter: String,
    cf_material_of_the_pipe_leadin: String,
    cf_total_members_living_in_the: String,
    cf_cartridge_size: String,
    cf_replacement_cycle_days: String,
    cf_replacement_day: String,
    gst_treatment: String,
    cf_cartridge_qty:{type:String,default:"1"},
    gst_no: String,
    place_of_contact: String,
    payment_terms_label: String,
    payment_terms: Number,
    created_by: String,
    has_attachment: Boolean,
    contact_number: String,
    tags: [String],
    cf_google_map_link:String,
    isSubscription:Boolean,
    installation: { type: Boolean, default: false },
    geoCoordinates: {
      type: { type: String, enum: ['Point']},
      coordinates: { type: [Number] },// [longitude, latitude]  
      default:{} 
    }, 
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true }
);

CustomerSchema.index({ geoCoordinates: "2dsphere" });

module.exports = mongoose.model("Customer", CustomerSchema);
