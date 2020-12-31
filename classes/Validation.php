<?php

namespace classes;

class Validation {
    private $_passed = false,
            $_errors = array(),
            $_db = null;

    public function __construct() {
        $this->_db = DB::getInstance();
    }

    /*
        IMPORTANT: check function will get $source argument as POST or GET arrays to fetch data from them and an array 
        of values which are inputs and each of this values has an array of rules as the value like the following :
        $validate = new Validation();

        $validate->check(array(
        "firstname"=>array(
            "required"=>false,
            "min"=>2,
            "max"=>50
        ),
        "lastname"=>array(
            "required"=>false,
            "min"=>2,
            "max"=>50
        )
        ....
        
        now we we gonna loop through the array of items and each item has an array of rules so we need also to loop through
        the rules array and first we need to check if the field is required. if the field is required but the value is missing
        there's no point to do the rest checks, we just add an error to _errors array
        if the value is not empty we need to make a switch case for each rule
        
    */
    public function check($source, $items = array()) {
        error_reporting(E_ERROR | E_PARSE);
        foreach($items as $item=>$rules) {
            foreach($rules as $rule => $rule_value) {
                $value = trim($source[$item]);
                $item = htmlspecialchars($item);

                if($rule === "required" && $rule_value == true && empty($value)) {
                    $this->addError("{$rules['name']} field is required");
                } else if(!empty($value)) {
                    switch($rule) {
                        // Some are implemented here in switch and some of them has their own functions like email func
                        case 'min':
                            if(strlen($value) < $rule_value) {
                                $this->addError("{$rules['name']} must be a minimum of $rule_value characters.");
                            }
                        break;
                        case 'max':
                            if(strlen($value) > $rule_value) {
                                $this->addError("{$rules['name']} must be a maximum of $rule_value characters.");
                            }
                        break;
                        case 'matches':
                            if($value != $source[$rule_value]) {
                                $this->addError("Passwords should be the same.");
                            }
                        break;
                        case 'unique':
                            $this->_db->query("SELECT * from user_info WHERE $item = '$value'");
                            if($this->_db->count()) {
                                $this->addError("{$rules['name']} already exists.");
                            }
                        break;
                        case 'email-or-username':
                            $email_or_username = trim($value);
                            $email_or_username = filter_var($email_or_username, FILTER_SANITIZE_EMAIL);
                            if(strpos($email_or_username, '@') == true) {
                                if(!preg_match("/^([a-z0-9\+_\-]+)(\.[a-z0-9\+_\-]+)*@([a-z0-9\-]+\.)+[a-z]{2,6}$/ix", $email_or_username)) {
                                    $this->addError("Invalid email address.");
                                }
                            } else {
                                // Handle username to be alphanumeric or just keep it like so (it's fine at least for now)
                            }
                        break;
                        case 'email':
                            $email = trim($value);
                            $email = filter_var($email, FILTER_SANITIZE_EMAIL);
                            if(strpos($email, '@') == true) {
                                if(!preg_match("/^([a-z0-9\+_\-]+)(\.[a-z0-9\+_\-]+)*@([a-z0-9\-]+\.)+[a-z]{2,6}$/ix", $email)) {
                                    $this->addError("Invalid email address.");
                                }
                            } else {
                                $this->addError("Invalid email address.");
                            }
                        break;
                    }
                }
            }
        }

        if(empty($this->_errors)) {
            $this->_passed = true;
        }

        return $this;
    }

    public function addError($error) {
        // This will add the error at the end of array
        $this->_errors[] = $error;
    }

    public function errors() {
        return $this->_errors;
    }

    public function passed() {
        return $this->_passed ? true : false;
    }
}